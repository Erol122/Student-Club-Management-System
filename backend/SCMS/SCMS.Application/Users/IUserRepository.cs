using SCMS.Domain.Entities;

namespace SCMS.Application.Users;

public interface IUserRepository
{
    Task<User?> GetByEntraObjectIdAsync(
        string entraObjectId,
        bool trackChanges,
        CancellationToken cancellationToken);

    Task AddAsync(User user, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
