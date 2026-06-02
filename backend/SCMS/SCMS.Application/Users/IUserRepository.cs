using SCMS.Domain.Entities;

namespace SCMS.Application.Users;

public interface IUserRepository
{
    Task<User?> GetByEntraObjectIdForUpdateAsync(
        string entraObjectId,
        CancellationToken cancellationToken);

    Task<bool> UserOwnsAnyActiveClubAsync(Guid userId, CancellationToken cancellationToken);

    Task AddAsync(User user, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
