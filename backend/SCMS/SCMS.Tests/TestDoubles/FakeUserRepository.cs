using SCMS.Application.Common.Exceptions;
using SCMS.Application.Users;
using SCMS.Domain.Entities;

namespace SCMS.Tests.TestDoubles;

internal sealed class FakeUserRepository : IUserRepository
{
    private readonly Queue<User?> usersByEntraObjectId = new();

    public bool UserOwnsAnyActiveClub { get; set; }
    public User? AddedUser { get; private set; }
    public int SaveChangesCount { get; private set; }
    public int GetByEntraObjectIdCount { get; private set; }
    public bool ThrowConflictOnFirstSave { get; set; }

    public void QueueUserByEntraObjectId(User? user)
    {
        usersByEntraObjectId.Enqueue(user);
    }

    public Task<User?> GetByEntraObjectIdForUpdateAsync(
        string entraObjectId,
        CancellationToken cancellationToken)
    {
        GetByEntraObjectIdCount++;
        return Task.FromResult(usersByEntraObjectId.Count == 0 ? null : usersByEntraObjectId.Dequeue());
    }

    public Task<bool> UserOwnsAnyActiveClubAsync(Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserOwnsAnyActiveClub);
    }

    public Task AddAsync(User user, CancellationToken cancellationToken)
    {
        AddedUser = user;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveChangesCount++;
        if (ThrowConflictOnFirstSave && SaveChangesCount == 1)
        {
            throw new PersistenceConflictException("Duplicate user.");
        }

        return Task.CompletedTask;
    }
}
