using SCMS.Application.ClubMemberships;
using SCMS.Application.Common;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.JoinRequests;

public sealed class JoinRequestService(
    IJoinRequestRepository joinRequestRepository,
    IClubMembershipRepository clubMembershipRepository) : IJoinRequestService
{
    public async Task<IReadOnlyList<JoinRequestDto>> GetClubJoinRequestsAsync(
        Guid clubId,
        JoinRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var requests = await joinRequestRepository.ListByClubAsync(clubId, status, cancellationToken);
        return requests.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<JoinRequestDto>> GetUserJoinRequestsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var requests = await joinRequestRepository.ListByUserAsync(userId, cancellationToken);
        return requests.Select(ToDto).ToList();
    }

    public async Task<ServiceResult<JoinRequestDto>> SubmitJoinRequestAsync(
        Guid clubId,
        Guid userId,
        SubmitJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.Message) && request.Message.Trim().Length > 1000)
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Validation,
                "Join request data is invalid.",
                new Dictionary<string, string[]>
                {
                    [nameof(request.Message)] = ["Message cannot exceed 1000 characters."]
                }));
        }

        var existingMembership = await clubMembershipRepository.GetByClubAndUserAsync(
            clubId, userId, trackChanges: false, cancellationToken);

        if (existingMembership is { Status: ClubMembershipStatus.Approved })
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                "You are already a member of this club."));
        }

        if (await joinRequestRepository.HasActivePendingRequestAsync(clubId, userId, cancellationToken))
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                "You already have a pending join request for this club."));
        }

        var joinRequest = new JoinRequest
        {
            ClubId = clubId,
            UserId = userId,
            Status = JoinRequestStatus.Pending,
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim(),
            SubmittedAt = DateTimeOffset.UtcNow
        };

        await joinRequestRepository.AddAsync(joinRequest, cancellationToken);
        await joinRequestRepository.SaveChangesAsync(cancellationToken);

        var saved = await joinRequestRepository.GetByIdAsync(joinRequest.Id, trackChanges: false, cancellationToken);
        return ServiceResult<JoinRequestDto>.Success(ToDto(saved!));
    }

    public async Task<ServiceResult<JoinRequestDto>> ApproveJoinRequestAsync(
        Guid requestId,
        Guid reviewerUserId,
        CancellationToken cancellationToken)
    {
        var joinRequest = await joinRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (joinRequest is null)
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Join request was not found."));
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot approve a request with status '{joinRequest.Status}'."));
        }

        joinRequest.Status = JoinRequestStatus.Approved;
        joinRequest.ReviewedByUserId = reviewerUserId;
        joinRequest.ReviewedAt = DateTimeOffset.UtcNow;

        var membership = await clubMembershipRepository.GetByClubAndUserAsync(
            joinRequest.ClubId, joinRequest.UserId, trackChanges: true, cancellationToken);

        if (membership is null)
        {
            membership = new ClubMembership
            {
                ClubId = joinRequest.ClubId,
                UserId = joinRequest.UserId,
                Role = ClubMembershipRole.Member,
                Status = ClubMembershipStatus.Approved,
                JoinedAt = DateTimeOffset.UtcNow,
                ApprovedByUserId = reviewerUserId
            };
            await clubMembershipRepository.AddAsync(membership, cancellationToken);
        }
        else if (membership.Status != ClubMembershipStatus.Approved)
        {
            membership.Status = ClubMembershipStatus.Approved;
            membership.ApprovedByUserId = reviewerUserId;
            membership.JoinedAt = DateTimeOffset.UtcNow;
        }

        await joinRequestRepository.SaveChangesAsync(cancellationToken);

        var updated = await joinRequestRepository.GetByIdAsync(requestId, trackChanges: false, cancellationToken);
        return ServiceResult<JoinRequestDto>.Success(ToDto(updated!));
    }

    public async Task<ServiceResult<JoinRequestDto>> RejectJoinRequestAsync(
        Guid requestId,
        Guid reviewerUserId,
        CancellationToken cancellationToken)
    {
        var joinRequest = await joinRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (joinRequest is null)
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Join request was not found."));
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            return ServiceResult<JoinRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot reject a request with status '{joinRequest.Status}'."));
        }

        joinRequest.Status = JoinRequestStatus.Rejected;
        joinRequest.ReviewedByUserId = reviewerUserId;
        joinRequest.ReviewedAt = DateTimeOffset.UtcNow;

        await joinRequestRepository.SaveChangesAsync(cancellationToken);

        var updated = await joinRequestRepository.GetByIdAsync(requestId, trackChanges: false, cancellationToken);
        return ServiceResult<JoinRequestDto>.Success(ToDto(updated!));
    }

    public async Task<ServiceResult> CancelJoinRequestAsync(
        Guid requestId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var joinRequest = await joinRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (joinRequest is null)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Join request was not found."));
        }

        if (joinRequest.UserId != userId)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.Forbidden,
                "You can only cancel your own join requests."));
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot cancel a request with status '{joinRequest.Status}'."));
        }

        joinRequest.Status = JoinRequestStatus.Cancelled;
        await joinRequestRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    private static JoinRequestDto ToDto(JoinRequest jr) => new(
        jr.Id,
        jr.ClubId,
        jr.Club.Name,
        jr.UserId,
        jr.User.DisplayName,
        jr.User.Email,
        jr.Status,
        jr.Message,
        jr.SubmittedAt,
        jr.ReviewedByUserId,
        jr.ReviewedAt,
        jr.CreatedAt,
        jr.UpdatedAt);
}
