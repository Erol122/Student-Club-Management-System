using System.Text.RegularExpressions;
using SCMS.Application.ClubMemberships;
using SCMS.Application.Clubs;
using SCMS.Application.Common;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubCreationRequests;

public sealed class ClubCreationRequestService(
    IClubCreationRequestRepository clubCreationRequestRepository,
    IClubRepository clubRepository,
    IClubMembershipRepository clubMembershipRepository,
    IUserRepository userRepository) : IClubCreationRequestService
{
    public async Task<IReadOnlyList<ClubCreationRequestDto>> GetAllRequestsAsync(
        ClubCreationRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var requests = await clubCreationRequestRepository.ListAsync(status, cancellationToken);
        return requests.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<ClubCreationRequestDto>> GetMyRequestsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var requests = await clubCreationRequestRepository.ListByUserAsync(userId, cancellationToken);
        return requests.Select(ToDto).ToList();
    }

    public async Task<ServiceResult<ClubCreationRequestDto>> SubmitAsync(
        Guid userId,
        SubmitClubCreationRequestRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateSubmitRequest(request);
        if (validationError is not null)
            return ServiceResult<ClubCreationRequestDto>.Failure(validationError);

        var entity = new ClubCreationRequest
        {
            ClubName = request.ClubName.Trim(),
            ClubDescription = NormalizeOptional(request.ClubDescription),
            ClubCategory = NormalizeOptional(request.ClubCategory),
            Message = NormalizeOptional(request.Message),
            Status = ClubCreationRequestStatus.Pending,
            RequestedByUserId = userId
        };

        await clubCreationRequestRepository.AddAsync(entity, cancellationToken);
        await clubCreationRequestRepository.SaveChangesAsync(cancellationToken);

        var saved = await clubCreationRequestRepository.GetByIdAsync(entity.Id, trackChanges: false, cancellationToken);
        return ServiceResult<ClubCreationRequestDto>.Success(ToDto(saved!));
    }

    public async Task<ServiceResult<ClubCreationRequestDto>> ApproveAsync(
        Guid requestId,
        Guid reviewerUserId,
        ReviewClubCreationRequestRequest review,
        CancellationToken cancellationToken)
    {
        var request = await clubCreationRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (request is null)
        {
            return ServiceResult<ClubCreationRequestDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound, "Club creation request was not found."));
        }

        if (request.Status != ClubCreationRequestStatus.Pending)
        {
            return ServiceResult<ClubCreationRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot approve a request with status '{request.Status}'."));
        }

        var slug = await BuildUniqueSlugAsync(request.ClubName, cancellationToken);

        // Create club — no save yet, tracked by DbContext
        var club = new Club
        {
            Name = request.ClubName,
            Slug = slug,
            Description = request.ClubDescription,
            Category = request.ClubCategory,
            Status = ClubStatus.Active,
            CreatedByUserId = request.RequestedByUserId
        };
        await clubRepository.AddAsync(club, cancellationToken);

        // Add requesting user as President of the new club
        var membership = new ClubMembership
        {
            ClubId = club.Id,
            UserId = request.RequestedByUserId,
            Role = ClubMembershipRole.President,
            Status = ClubMembershipStatus.Approved,
            JoinedAt = DateTimeOffset.UtcNow,
            ApprovedByUserId = reviewerUserId
        };
        await clubMembershipRepository.AddAsync(membership, cancellationToken);

        // Promote user to ClubLeader if they're still a regular Member
        var requester = await userRepository.GetByIdAsync(request.RequestedByUserId, trackChanges: true, cancellationToken);
        if (requester is { Role: AppRole.Member })
        {
            requester.Role = AppRole.ClubLeader;
        }

        // Mark request as approved
        request.Status = ClubCreationRequestStatus.Approved;
        request.ReviewedByUserId = reviewerUserId;
        request.ReviewedAt = DateTimeOffset.UtcNow;
        request.ReviewNote = NormalizeOptional(review.ReviewNote);
        request.CreatedClubId = club.Id;

        // Single save — atomically persists club, membership, user role change, and request update
        await clubCreationRequestRepository.SaveChangesAsync(cancellationToken);

        var updated = await clubCreationRequestRepository.GetByIdAsync(requestId, trackChanges: false, cancellationToken);
        return ServiceResult<ClubCreationRequestDto>.Success(ToDto(updated!));
    }

    public async Task<ServiceResult<ClubCreationRequestDto>> RejectAsync(
        Guid requestId,
        Guid reviewerUserId,
        ReviewClubCreationRequestRequest review,
        CancellationToken cancellationToken)
    {
        var request = await clubCreationRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (request is null)
        {
            return ServiceResult<ClubCreationRequestDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound, "Club creation request was not found."));
        }

        if (request.Status != ClubCreationRequestStatus.Pending)
        {
            return ServiceResult<ClubCreationRequestDto>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot reject a request with status '{request.Status}'."));
        }

        request.Status = ClubCreationRequestStatus.Rejected;
        request.ReviewedByUserId = reviewerUserId;
        request.ReviewedAt = DateTimeOffset.UtcNow;
        request.ReviewNote = NormalizeOptional(review.ReviewNote);

        await clubCreationRequestRepository.SaveChangesAsync(cancellationToken);

        var updated = await clubCreationRequestRepository.GetByIdAsync(requestId, trackChanges: false, cancellationToken);
        return ServiceResult<ClubCreationRequestDto>.Success(ToDto(updated!));
    }

    public async Task<ServiceResult> CancelAsync(
        Guid requestId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var request = await clubCreationRequestRepository.GetByIdAsync(requestId, trackChanges: true, cancellationToken);
        if (request is null)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.NotFound, "Club creation request was not found."));
        }

        if (request.RequestedByUserId != userId)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.Forbidden, "You can only cancel your own requests."));
        }

        if (request.Status != ClubCreationRequestStatus.Pending)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                $"Cannot cancel a request with status '{request.Status}'."));
        }

        request.Status = ClubCreationRequestStatus.Cancelled;
        await clubCreationRequestRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    private async Task<string> BuildUniqueSlugAsync(string name, CancellationToken cancellationToken)
    {
        var baseSlug = Regex.Replace(name.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        var slug = baseSlug;

        if (!await clubRepository.SlugExistsAsync(slug, ignoredClubId: null, cancellationToken))
            return slug;

        // Append a short unique suffix to avoid collisions
        slug = $"{baseSlug}-{Guid.NewGuid().ToString("N")[..8]}";
        return slug;
    }

    private static ServiceError? ValidateSubmitRequest(SubmitClubCreationRequestRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.ClubName))
            errors[nameof(request.ClubName)] = ["Club name is required."];
        else if (request.ClubName.Trim().Length > 150)
            errors[nameof(request.ClubName)] = ["Club name cannot exceed 150 characters."];

        if (!string.IsNullOrWhiteSpace(request.ClubDescription) && request.ClubDescription.Trim().Length > 2000)
            errors[nameof(request.ClubDescription)] = ["Description cannot exceed 2000 characters."];

        if (!string.IsNullOrWhiteSpace(request.ClubCategory) && request.ClubCategory.Trim().Length > 100)
            errors[nameof(request.ClubCategory)] = ["Category cannot exceed 100 characters."];

        if (!string.IsNullOrWhiteSpace(request.Message) && request.Message.Trim().Length > 1000)
            errors[nameof(request.Message)] = ["Message cannot exceed 1000 characters."];

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Club creation request data is invalid.", errors);
    }

    private static ClubCreationRequestDto ToDto(ClubCreationRequest r) => new(
        r.Id,
        r.ClubName,
        r.ClubDescription,
        r.ClubCategory,
        r.Message,
        r.Status,
        r.RequestedByUserId,
        r.RequestedByUser.DisplayName,
        r.RequestedByUser.Email,
        r.ReviewedByUserId,
        r.ReviewedAt,
        r.ReviewNote,
        r.CreatedClubId,
        r.CreatedAt,
        r.UpdatedAt);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
