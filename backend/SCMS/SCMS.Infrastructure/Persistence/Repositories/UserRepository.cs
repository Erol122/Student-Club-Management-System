using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.Common.Exceptions;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(AppDbContext dbContext) : IUserRepository
{
    public async Task<User?> GetByEntraObjectIdForUpdateAsync(
        string entraObjectId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users.SingleOrDefaultAsync(
            user => user.EntraObjectId == entraObjectId,
            cancellationToken);
    }

    public async Task<bool> UserOwnsAnyActiveClubAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.ClubMemberships.AnyAsync(
            membership =>
                membership.UserId == userId &&
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President &&
                membership.Club.Status == ClubStatus.Active,
            cancellationToken);
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
