using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.ClubWorkflows;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class ClubWorkflowRepository(AppDbContext dbContext) : IClubWorkflowRepository
{
    public async Task<User?> GetUserByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<User> query = dbContext.Users;

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public async Task<Club?> GetClubByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<Club> query = dbContext.Clubs
            .Include(club => club.CreatedByUser)
            .Include(club => club.Memberships)
            .ThenInclude(membership => membership.User);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(club => club.Id == id, cancellationToken);
    }

    public async Task<Club?> GetClubProposalByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<Club> query = dbContext.Clubs
            .Include(club => club.CreatedByUser)
            .Include(club => club.Memberships);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(
            club => club.Id == id && club.Status == ClubStatus.Draft,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Club>> ListPendingClubProposalsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Clubs
            .AsNoTracking()
            .Include(club => club.CreatedByUser)
            .Where(club => club.Status == ClubStatus.Draft)
            .OrderBy(club => club.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<JoinRequest>> ListPendingJoinRequestsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        var query = dbContext.JoinRequests
            .AsNoTracking()
            .Include(joinRequest => joinRequest.Club)
            .Include(joinRequest => joinRequest.User)
            .Where(joinRequest => joinRequest.Status == JoinRequestStatus.Pending);

        if (!includeAllClubs)
        {
            var ownedClubIds = await dbContext.ClubMemberships
                .AsNoTracking()
                .Where(membership =>
                    membership.UserId == currentUserId &&
                    membership.Status == ClubMembershipStatus.Approved &&
                    membership.Role == ClubMembershipRole.President)
                .Select(membership => membership.ClubId)
                .ToListAsync(cancellationToken);

            query = query.Where(joinRequest =>
                joinRequest.UserId == currentUserId ||
                ownedClubIds.Contains(joinRequest.ClubId));
        }

        return await query
            .OrderBy(joinRequest => joinRequest.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<JoinRequest?> GetJoinRequestByIdAsync(
        Guid id,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        IQueryable<JoinRequest> query = dbContext.JoinRequests
            .Include(joinRequest => joinRequest.Club)
            .Include(joinRequest => joinRequest.User);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(joinRequest => joinRequest.Id == id, cancellationToken);
    }

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken)
    {
        return await dbContext.Clubs
            .IgnoreQueryFilters()
            .AnyAsync(club => club.Slug == slug, cancellationToken);
    }

    public async Task<bool> UserHasApprovedMembershipAsync(
        Guid clubId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClubMemberships.AnyAsync(
            membership =>
                membership.ClubId == clubId &&
                membership.UserId == userId &&
                membership.Status == ClubMembershipStatus.Approved,
            cancellationToken);
    }

    public async Task<bool> UserOwnsClubAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.ClubMemberships.AnyAsync(
            membership =>
                membership.ClubId == clubId &&
                membership.UserId == userId &&
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President,
            cancellationToken);
    }

    public async Task<bool> PendingJoinRequestExistsAsync(
        Guid clubId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await dbContext.JoinRequests.AnyAsync(
            joinRequest =>
                joinRequest.ClubId == clubId &&
                joinRequest.UserId == userId &&
                joinRequest.Status == JoinRequestStatus.Pending,
            cancellationToken);
    }

    public async Task AddClubAsync(Club club, CancellationToken cancellationToken)
    {
        await dbContext.Clubs.AddAsync(club, cancellationToken);
    }

    public async Task AddClubMembershipAsync(ClubMembership membership, CancellationToken cancellationToken)
    {
        await dbContext.ClubMemberships.AddAsync(membership, cancellationToken);
    }

    public async Task AddJoinRequestAsync(JoinRequest joinRequest, CancellationToken cancellationToken)
    {
        await dbContext.JoinRequests.AddAsync(joinRequest, cancellationToken);
    }

    public void RemoveClub(Club club)
    {
        dbContext.Clubs.Remove(club);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new PersistenceConflictException("A resource with the same unique value already exists.");
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            throw new RelatedResourceNotFoundException("One or more referenced resources do not exist.");
        }
        catch (SqlException ex) when (IsDatabaseUnavailable(ex))
        {
            throw new PersistenceUnavailableException("The database is not available right now.", ex);
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        return exception.GetBaseException() is SqlException sqlException
            && sqlException.Number is 2601 or 2627;
    }

    private static bool IsForeignKeyViolation(DbUpdateException exception)
    {
        return exception.GetBaseException() is SqlException sqlException
            && sqlException.Number == 547;
    }

    private static bool IsDatabaseUnavailable(SqlException exception)
    {
        return exception.Number is -2 or 53 or 4060 or 10053 or 10054 or 10060 or 10061;
    }
}
