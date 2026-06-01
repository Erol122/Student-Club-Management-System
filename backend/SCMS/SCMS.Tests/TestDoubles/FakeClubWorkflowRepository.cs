using SCMS.Application.ClubWorkflows;
using SCMS.Domain.Entities;

namespace SCMS.Tests.TestDoubles;

internal sealed class FakeClubWorkflowRepository : IClubWorkflowRepository
{
    public Func<Guid, User?> GetUserById { get; set; } = _ => null;
    public Func<Guid, bool> UserExists { get; set; } = _ => true;
    public Func<Guid, Club?> GetClubById { get; set; } = _ => null;
    public Func<Guid, Club?> GetClubByIdForUpdate { get; set; } = _ => null;
    public Func<Guid, Club?> GetClubProposalByIdForUpdate { get; set; } = _ => null;
    public Func<string, bool> SlugExists { get; set; } = _ => false;
    public Func<Guid, Guid, bool> UserHasApprovedMembership { get; set; } = (_, _) => false;
    public Func<Guid, Guid, bool> UserOwnsClub { get; set; } = (_, _) => false;
    public Func<Guid, Guid?, bool> UserOwnsAnyActiveClub { get; set; } = (_, _) => false;
    public Func<Guid, Guid, bool> PendingJoinRequestExists { get; set; } = (_, _) => false;
    public IReadOnlyList<Club> PendingClubProposals { get; set; } = [];
    public IReadOnlyList<JoinRequest> PendingJoinRequests { get; set; } = [];
    public Func<Guid, JoinRequest?> GetJoinRequestByIdForUpdate { get; set; } = _ => null;
    public List<Club> AddedClubs { get; } = [];
    public List<ClubMembership> AddedMemberships { get; } = [];
    public List<JoinRequest> AddedJoinRequests { get; } = [];
    public Club? RemovedClub { get; private set; }
    public int SaveChangesCount { get; private set; }
    public (Guid CurrentUserId, bool IncludeAllClubs)? LastPendingJoinRequestsQuery { get; private set; }

    public Task<User?> GetUserByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(GetUserById(id));
    }

    public Task<bool> UserExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserExists(id));
    }

    public Task<Club?> GetClubByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(GetClubById(id));
    }

    public Task<Club?> GetClubByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(GetClubByIdForUpdate(id));
    }

    public Task<Club?> GetClubProposalByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(GetClubProposalByIdForUpdate(id));
    }

    public Task<IReadOnlyList<Club>> ListPendingClubProposalsAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(PendingClubProposals);
    }

    public Task<IReadOnlyList<JoinRequest>> ListPendingJoinRequestsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        LastPendingJoinRequestsQuery = (currentUserId, includeAllClubs);
        return Task.FromResult(PendingJoinRequests);
    }

    public Task<JoinRequest?> GetJoinRequestByIdForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return Task.FromResult(GetJoinRequestByIdForUpdate(id));
    }

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken)
    {
        return Task.FromResult(SlugExists(slug));
    }

    public Task<bool> UserHasApprovedMembershipAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserHasApprovedMembership(clubId, userId));
    }

    public Task<bool> UserOwnsClubAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserOwnsClub(clubId, userId));
    }

    public Task<bool> UserOwnsAnyActiveClubAsync(
        Guid userId,
        Guid? excludedClubId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(UserOwnsAnyActiveClub(userId, excludedClubId));
    }

    public Task<bool> PendingJoinRequestExistsAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(PendingJoinRequestExists(clubId, userId));
    }

    public Task AddClubAsync(Club club, CancellationToken cancellationToken)
    {
        AddedClubs.Add(club);
        return Task.CompletedTask;
    }

    public Task AddClubMembershipAsync(ClubMembership membership, CancellationToken cancellationToken)
    {
        AddedMemberships.Add(membership);
        return Task.CompletedTask;
    }

    public Task AddJoinRequestAsync(JoinRequest joinRequest, CancellationToken cancellationToken)
    {
        AddedJoinRequests.Add(joinRequest);
        return Task.CompletedTask;
    }

    public void RemoveClub(Club club)
    {
        RemovedClub = club;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveChangesCount++;
        return Task.CompletedTask;
    }
}
