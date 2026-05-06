using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.Common.Exceptions;
using SCMS.Application.Users;
using SCMS.Domain.Entities;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(AppDbContext dbContext) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken)
    {
        IQueryable<User> query = dbContext.Users;

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public async Task<User?> GetByEntraObjectIdAsync(
        string entraObjectId,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        IQueryable<User> query = dbContext.Users;

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(
            user => user.EntraObjectId == entraObjectId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken)
    {
        await dbContext.Users.AddAsync(user, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Two concurrent requests (e.g. MSAL token refresh + API call) both hit the
            // middleware user-provisioning upsert simultaneously. The loser gets a RowVersion
            // mismatch. Refresh the stale entries from the DB and retry once.
            foreach (var entry in ex.Entries)
            {
                var dbValues = await entry.GetDatabaseValuesAsync(cancellationToken);
                if (dbValues is not null)
                    entry.OriginalValues.SetValues(dbValues);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new PersistenceConflictException("A user with the same unique value already exists.");
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

    private static bool IsDatabaseUnavailable(SqlException exception)
    {
        return exception.Number is -2 or 53 or 4060 or 10053 or 10054 or 10060 or 10061;
    }
}
