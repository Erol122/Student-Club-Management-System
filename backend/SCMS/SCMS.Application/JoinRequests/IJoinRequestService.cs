using SCMS.Application.Common;
using SCMS.Domain.Enums;

namespace SCMS.Application.JoinRequests;

public interface IJoinRequestService
{
    Task<IReadOnlyList<JoinRequestDto>> GetClubJoinRequestsAsync(Guid clubId, JoinRequestStatus? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<JoinRequestDto>> GetUserJoinRequestsAsync(Guid userId, CancellationToken cancellationToken);
    Task<ServiceResult<JoinRequestDto>> SubmitJoinRequestAsync(Guid clubId, Guid userId, SubmitJoinRequestRequest request, CancellationToken cancellationToken);
    Task<ServiceResult<JoinRequestDto>> ApproveJoinRequestAsync(Guid requestId, Guid reviewerUserId, CancellationToken cancellationToken);
    Task<ServiceResult<JoinRequestDto>> RejectJoinRequestAsync(Guid requestId, Guid reviewerUserId, CancellationToken cancellationToken);
    Task<ServiceResult> CancelJoinRequestAsync(Guid requestId, Guid userId, CancellationToken cancellationToken);
}
