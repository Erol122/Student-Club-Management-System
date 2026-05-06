using SCMS.Application.Common;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubCreationRequests;

public interface IClubCreationRequestService
{
    Task<IReadOnlyList<ClubCreationRequestDto>> GetAllRequestsAsync(ClubCreationRequestStatus? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<ClubCreationRequestDto>> GetMyRequestsAsync(Guid userId, CancellationToken cancellationToken);
    Task<ServiceResult<ClubCreationRequestDto>> SubmitAsync(Guid userId, SubmitClubCreationRequestRequest request, CancellationToken cancellationToken);
    Task<ServiceResult<ClubCreationRequestDto>> ApproveAsync(Guid requestId, Guid reviewerUserId, ReviewClubCreationRequestRequest review, CancellationToken cancellationToken);
    Task<ServiceResult<ClubCreationRequestDto>> RejectAsync(Guid requestId, Guid reviewerUserId, ReviewClubCreationRequestRequest review, CancellationToken cancellationToken);
    Task<ServiceResult> CancelAsync(Guid requestId, Guid userId, CancellationToken cancellationToken);
}
