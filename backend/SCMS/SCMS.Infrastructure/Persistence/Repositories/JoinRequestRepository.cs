using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.Common.Exceptions;
using SCMS.Application.JoinRequests;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class JoinRequestRepository(AppDbContext dbContext) : IJoinRequestRepository
{
    public async Task<JoinRequest?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<JoinRequest> query = dbContext.JoinRequests
            .Include(jr => jr.Club)
            .Include(jr => jr.User);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(jr => jr.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<JoinRequest>> ListByClubAsync(
        Guid clubId,
        JoinRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var query = dbContext.JoinRequests
            .AsNoTracking()
            .Include(jr => jr.Club)
            .Include(jr => jr.User)
            .Where(jr => jr.ClubId == clubId);

        if (status.HasValue)
        {
            query = query.Where(jr => jr.Status == status.Value);
        }

        return await query
            .OrderByDescending(jr => jr.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<JoinRequest>> ListByUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.JoinRequests
            .AsNoTracking()
            .Include(jr => jr.Club)
            .Include(jr => jr.User)
            .Where(jr => jr.UserId == userId)
            .OrderByDescending(jr => jr.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasActivePendingRequestAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.JoinRequests.AnyAsync(
            jr => jr.ClubId == clubId && jr.UserId == userId && jr.Status == JoinRequestStatus.Pending,
            cancellationToken);
    }

    public async Task AddAsync(JoinRequest joinRequest, CancellationToken cancellationToken)
    {
        await dbContext.JoinRequests.AddAsync(joinRequest, cancellationToken);
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
