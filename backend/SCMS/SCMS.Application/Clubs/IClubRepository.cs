using SCMS.Domain.Entities;

namespace SCMS.Application.Clubs;

public interface IClubRepository
{
    Task<IReadOnlyList<Club>> ListAsync(
        Guid currentUserId,
        bool onlyOwnedClubs,
        string? search,
        string? category,
        CancellationToken cancellationToken);

    Task<Club?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        bool onlyOwnedClubs,
        CancellationToken cancellationToken);

    Task<Club?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> SlugExistsAsync(
        string slug,
        Guid? ignoredClubId,
        CancellationToken cancellationToken);

    Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken);

    Task AddAsync(Club club, CancellationToken cancellationToken);

    void Remove(Club club);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
