using SCMS.Application.Clubs;
using SCMS.Domain.Entities;

namespace SCMS.Tests.TestDoubles;

internal sealed class FakeClubRepository : IClubRepository
{
    public IReadOnlyList<Club> ClubsToList { get; set; } = [];
    public Club? ClubToGet { get; set; }
    public Club? ClubForUpdate { get; set; }
    public bool SlugExists { get; set; }
    public bool UserExists { get; set; } = true;
    public Club? AddedClub { get; private set; }
    public Club? RemovedClub { get; private set; }
    public int SaveChangesCount { get; private set; }
    public (Guid CurrentUserId, bool OnlyOwnedClubs, string? Search, string? Category)? LastListRequest { get; private set; }
    public (Guid Id, Guid CurrentUserId, bool OnlyOwnedClubs)? LastGetRequest { get; private set; }
    public (string Slug, Guid? IgnoredClubId)? LastSlugCheck { get; private set; }

    public Task<IReadOnlyList<Club>> ListAsync(
        Guid currentUserId,
        bool onlyOwnedClubs,
        string? search,
        string? category,
        CancellationToken cancellationToken)
    {
        LastListRequest = (currentUserId, onlyOwnedClubs, search, category);
        return Task.FromResult(ClubsToList);
    }

    public Task<Club?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        bool onlyOwnedClubs,
        CancellationToken cancellationToken)
    {
        LastGetRequest = (id, currentUserId, onlyOwnedClubs);
        return Task.FromResult(ClubToGet);
    }

    public Task<Club?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(ClubForUpdate);
    }

    public Task<bool> SlugExistsAsync(string slug, Guid? ignoredClubId, CancellationToken cancellationToken)
    {
        LastSlugCheck = (slug, ignoredClubId);
        return Task.FromResult(SlugExists);
    }

    public Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserExists);
    }

    public Task AddAsync(Club club, CancellationToken cancellationToken)
    {
        AddedClub = club;
        return Task.CompletedTask;
    }

    public void Remove(Club club)
    {
        RemovedClub = club;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveChangesCount++;
        return Task.CompletedTask;
    }
}
