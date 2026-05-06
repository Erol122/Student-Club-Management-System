using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.ClubCreationRequests;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class ClubCreationRequestRepository(AppDbContext dbContext) : IClubCreationRequestRepository
{
    public async Task<ClubCreationRequest?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<ClubCreationRequest> query = dbContext.ClubCreationRequests
            .Include(r => r.RequestedByUser);

        if (!trackChanges)
            query = query.AsNoTracking();

        return await query.SingleOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<ClubCreationRequest>> ListAsync(
        ClubCreationRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ClubCreationRequests
            .AsNoTracking()
            .Include(r => r.RequestedByUser);

        if (status.HasValue)
            return await query
                .Where(r => r.Status == status.Value)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClubCreationRequest>> ListByUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.ClubCreationRequests
            .AsNoTracking()
            .Include(r => r.RequestedByUser)
            .Where(r => r.RequestedByUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(ClubCreationRequest request, CancellationToken cancellationToken)
    {
        await dbContext.ClubCreationRequests.AddAsync(request, cancellationToken);
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
