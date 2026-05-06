using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.ClubMemberships;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class ClubMembershipRepository(AppDbContext dbContext) : IClubMembershipRepository
{
    public async Task<IReadOnlyList<ClubMembership>> ListByClubAsync(Guid clubId, CancellationToken cancellationToken)
    {
        return await dbContext.ClubMemberships
            .AsNoTracking()
            .Include(m => m.Club)
            .Include(m => m.User)
            .Where(m => m.ClubId == clubId && m.Status == ClubMembershipStatus.Approved)
            .OrderBy(m => m.User.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClubMembership?> GetByClubAndUserAsync(
        Guid clubId,
        Guid userId,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        IQueryable<ClubMembership> query = dbContext.ClubMemberships
            .Include(m => m.Club)
            .Include(m => m.User);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(
            m => m.ClubId == clubId && m.UserId == userId,
            cancellationToken);
    }

    public async Task AddAsync(ClubMembership membership, CancellationToken cancellationToken)
    {
        await dbContext.ClubMemberships.AddAsync(membership, cancellationToken);
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

    private static bool IsUniqueConstraintViolation(DbUpdateException exception) =>
        exception.GetBaseException() is SqlException sql && sql.Number is 2601 or 2627;

    private static bool IsForeignKeyViolation(DbUpdateException exception) =>
        exception.GetBaseException() is SqlException sql && sql.Number == 547;

    private static bool IsDatabaseUnavailable(SqlException exception) =>
        exception.Number is -2 or 53 or 4060 or 10053 or 10054 or 10060 or 10061;
}
