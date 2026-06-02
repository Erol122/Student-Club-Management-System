using SCMS.Application.Common;
using SCMS.Application.Users;

namespace SCMS.Application.ClubWorkflows;

public interface IClubWorkflowService
{
    Task<ServiceResult<ClubProposalDto>> SubmitClubProposalAsync(
        CurrentUserDto currentUser,
        SubmitClubProposalRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult<IReadOnlyList<ClubProposalDto>>> GetPendingClubProposalsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubProposalDto>> ApproveClubProposalAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubProposalDto>> RejectClubProposalAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken);

    Task<ServiceResult<JoinRequestDto>> SubmitJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        SubmitJoinRequestRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult<IReadOnlyList<JoinRequestDto>>> GetPendingJoinRequestsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken);

    Task<ServiceResult<JoinRequestDto>> ApproveJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid requestId,
        CancellationToken cancellationToken);

    Task<ServiceResult<JoinRequestDto>> RejectJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid requestId,
        CancellationToken cancellationToken);

    Task<ServiceResult> DeleteClubAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken);

    Task<ServiceResult> LeaveClubAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken);
}
