using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SCMS.Application.Clubs;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class ClubRepository(AppDbContext dbContext) : IClubRepository
{
    public async Task<IReadOnlyList<Club>> ListAsync(
        Guid currentUserId,
        bool onlyOwnedClubs,
        string? search,
        string? category,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Clubs
            .AsNoTracking()
            .Include(club => club.Memberships.Where(membership =>
                membership.Status == ClubMembershipStatus.Approved))
            .ThenInclude(membership => membership.User)
            .Where(club => club.Status == ClubStatus.Active);

        if (onlyOwnedClubs)
        {
            query = query.Where(club => club.Memberships.Any(membership =>
                membership.UserId == currentUserId &&
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(club =>
                club.Name.Contains(term) ||
                (club.Description != null && club.Description.Contains(term)) ||
                (club.Category != null && club.Category.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalizedCategory = category.Trim();
            query = query.Where(club => club.Category == normalizedCategory);
        }

        return await query
            .OrderBy(club => club.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Club?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        bool onlyOwnedClubs,
        CancellationToken cancellationToken)
    {
        var query = ClubWithApprovedMembers()
            .AsNoTracking()
            .Where(club => club.Id == id && club.Status == ClubStatus.Active);

        if (onlyOwnedClubs)
        {
            query = query.Where(club => club.Memberships.Any(membership =>
                membership.UserId == currentUserId &&
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President));
        }

        return await query.SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<Club?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await ClubWithApprovedMembers()
            .SingleOrDefaultAsync(club => club.Id == id, cancellationToken);
    }

    private IQueryable<Club> ClubWithApprovedMembers()
    {
        return dbContext.Clubs
            .Include(club => club.Memberships.Where(membership =>
                membership.Status == ClubMembershipStatus.Approved))
            .ThenInclude(membership => membership.User);
    }

    public async Task<bool> SlugExistsAsync(
        string slug,
        Guid? ignoredClubId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Clubs
            .IgnoreQueryFilters()
            .AnyAsync(
                club => club.Slug == slug && (!ignoredClubId.HasValue || club.Id != ignoredClubId.Value),
                cancellationToken);
    }

    public async Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Users.AnyAsync(user => user.Id == userId, cancellationToken);
    }

    public async Task AddAsync(Club club, CancellationToken cancellationToken)
    {
        await dbContext.Clubs.AddAsync(club, cancellationToken);
    }

    public void Remove(Club club)
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
