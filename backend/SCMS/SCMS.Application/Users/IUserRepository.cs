using SCMS.Domain.Entities;

namespace SCMS.Application.Users;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken);

    Task<User?> GetByEntraObjectIdAsync(
        string entraObjectId,
        bool trackChanges,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken);

    Task AddAsync(User user, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
