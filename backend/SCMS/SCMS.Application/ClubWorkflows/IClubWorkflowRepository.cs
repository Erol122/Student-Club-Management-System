using SCMS.Domain.Entities;

namespace SCMS.Application.ClubWorkflows;

public interface IClubWorkflowRepository
{
    Task<User?> GetUserByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> UserExistsAsync(Guid id, CancellationToken cancellationToken);

    Task<Club?> GetClubByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<Club?> GetClubByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<Club?> GetClubProposalByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Club>> ListPendingClubProposalsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<JoinRequest>> ListPendingJoinRequestsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken);

    Task<JoinRequest?> GetJoinRequestByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken);

    Task<bool> UserHasApprovedMembershipAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);

    Task<bool> UserOwnsClubAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);

    Task<bool> UserOwnsAnyActiveClubAsync(
        Guid userId,
        Guid? excludedClubId,
        CancellationToken cancellationToken);

    Task<bool> PendingJoinRequestExistsAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);

    Task AddClubAsync(Club club, CancellationToken cancellationToken);

    Task AddClubMembershipAsync(ClubMembership membership, CancellationToken cancellationToken);

    Task AddJoinRequestAsync(JoinRequest joinRequest, CancellationToken cancellationToken);

    void RemoveClub(Club club);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
