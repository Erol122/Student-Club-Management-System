using System.Text.RegularExpressions;
using SCMS.Application.Common;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubWorkflows;

public sealed class ClubWorkflowService(IClubWorkflowRepository repository) : IClubWorkflowService
{
    public async Task<ServiceResult<ClubProposalDto>> SubmitClubProposalAsync(
        CurrentUserDto currentUser,
        SubmitClubProposalRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateProposal(request);
        if (validationError is not null)
        {
            return ServiceResult<ClubProposalDto>.Failure(validationError);
        }

        var proposer = await repository.GetUserByIdForUpdateAsync(currentUser.Id, cancellationToken);
        if (proposer is null)
        {
            return NotFound<ClubProposalDto>("Current user was not found.");
        }

        var slug = NormalizeSlug(request.Name);
        if (string.IsNullOrWhiteSpace(slug))
        {
            return ServiceResult<ClubProposalDto>.Failure(ValidationError(
                nameof(request.Name),
                "Club name must contain at least one letter or number."));
        }

        if (await repository.SlugExistsAsync(slug, cancellationToken))
        {
            return Conflict<ClubProposalDto>("A club or proposal with this name already exists.");
        }

        var now = DateTimeOffset.UtcNow;
        var club = Club.Propose(
            request.Name.Trim(),
            slug,
            request.Mission.Trim(),
            NormalizeOptionalText(request.Category),
            NormalizeOptionalText(request.ImageKey),
            proposer);

        await repository.AddClubAsync(club, cancellationToken);
        await repository.AddClubMembershipAsync(
            ClubMembership.CreatePendingPresident(club, proposer, now),
            cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubProposalDto>.Success(ToProposalDto(club));
    }

    public async Task<ServiceResult<IReadOnlyList<ClubProposalDto>>> GetPendingClubProposalsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return ServiceResult<IReadOnlyList<ClubProposalDto>>.Success([]);
        }

        var proposals = await repository.ListPendingClubProposalsAsync(cancellationToken);
        return ServiceResult<IReadOnlyList<ClubProposalDto>>.Success(
            proposals.Select(ToProposalDto).ToList());
    }

    public async Task<ServiceResult<ClubProposalDto>> ApproveClubProposalAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return Forbidden<ClubProposalDto>();
        }

        var club = await repository.GetClubProposalByIdForUpdateAsync(clubId, cancellationToken);
        if (club is null)
        {
            return NotFound<ClubProposalDto>("Club proposal was not found.");
        }

        if (club.Status != ClubStatus.Draft)
        {
            return Conflict<ClubProposalDto>("Only pending club proposals can be approved.");
        }

        if (club.CreatedByUserId is null)
        {
            return ServiceResult<ClubProposalDto>.Failure(ValidationError(
                nameof(club.CreatedByUserId),
                "Club proposal has no proposer to assign as owner."));
        }

        var owner = await repository.GetUserByIdForUpdateAsync(club.CreatedByUserId.Value, cancellationToken);
        if (owner is null)
        {
            return NotFound<ClubProposalDto>("Club proposer was not found.");
        }

        club.ApproveProposal(owner);

        await UpsertMembershipAsync(
            club.Id,
            owner.Id,
            ClubMembershipRole.President,
            ClubMembershipStatus.Approved,
            currentUser.Id,
            cancellationToken);

        await repository.SaveChangesAsync(cancellationToken);
        club.CreatedByUser = owner;

        return ServiceResult<ClubProposalDto>.Success(ToProposalDto(club));
    }

    public async Task<ServiceResult<ClubProposalDto>> RejectClubProposalAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return Forbidden<ClubProposalDto>();
        }

        var club = await repository.GetClubProposalByIdForUpdateAsync(clubId, cancellationToken);
        if (club is null)
        {
            return NotFound<ClubProposalDto>("Club proposal was not found.");
        }

        if (club.Status != ClubStatus.Draft)
        {
            return Conflict<ClubProposalDto>("Only pending club proposals can be rejected.");
        }

        club.RejectProposal();
        if (club.CreatedByUserId.HasValue)
        {
            await UpsertMembershipAsync(
                club.Id,
                club.CreatedByUserId.Value,
                ClubMembershipRole.President,
                ClubMembershipStatus.Rejected,
                currentUser.Id,
                cancellationToken);
        }

        await repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<ClubProposalDto>.Success(ToProposalDto(club));
    }

    public async Task<ServiceResult<JoinRequestDto>> SubmitJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        SubmitJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        var club = await repository.GetClubByIdAsync(clubId, cancellationToken);
        if (club is null || club.Status != ClubStatus.Active)
        {
            return NotFound<JoinRequestDto>("Club was not found.");
        }

        if (!await repository.UserExistsAsync(currentUser.Id, cancellationToken))
        {
            return NotFound<JoinRequestDto>("Current user was not found.");
        }

        if (await repository.UserHasApprovedMembershipAsync(clubId, currentUser.Id, cancellationToken))
        {
            return Conflict<JoinRequestDto>("You are already a member of this club.");
        }

        if (await repository.PendingJoinRequestExistsAsync(clubId, currentUser.Id, cancellationToken))
        {
            return Conflict<JoinRequestDto>("You already have a pending request for this club.");
        }

        var joinRequest = JoinRequest.Submit(
            club.Id,
            currentUser.Id,
            NormalizeOptionalText(request.Message),
            DateTimeOffset.UtcNow);

        await repository.AddJoinRequestAsync(joinRequest, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<JoinRequestDto>.Success(ToJoinRequestDto(joinRequest, club.Name, currentUser));
    }

    public async Task<ServiceResult<IReadOnlyList<JoinRequestDto>>> GetPendingJoinRequestsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken)
    {
        var requests = await repository.ListPendingJoinRequestsAsync(
            currentUser.Id,
            currentUser.IsAdmin,
            cancellationToken);

        return ServiceResult<IReadOnlyList<JoinRequestDto>>.Success(
            requests.Select(ToJoinRequestDto).ToList());
    }

    public async Task<ServiceResult<JoinRequestDto>> ApproveJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        return await ReviewJoinRequestAsync(currentUser, requestId, JoinRequestStatus.Approved, cancellationToken);
    }

    public async Task<ServiceResult<JoinRequestDto>> RejectJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        return await ReviewJoinRequestAsync(currentUser, requestId, JoinRequestStatus.Rejected, cancellationToken);
    }

    public async Task<ServiceResult> DeleteClubAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return ServiceResult.Failure(ForbiddenError());
        }

        var club = await repository.GetClubByIdForUpdateAsync(clubId, cancellationToken);
        if (club is null)
        {
            return ServiceResult.Failure(new ServiceError(ServiceErrorType.NotFound, "Club was not found."));
        }

        var clubLeaderIds = club.Memberships
            .Where(membership =>
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President &&
                membership.User.Role == AppRole.ClubLeader)
            .Select(membership => membership.UserId)
            .Distinct()
            .ToList();

        foreach (var leaderId in clubLeaderIds)
        {
            var ownsAnotherActiveClub = await repository.UserOwnsAnyActiveClubAsync(
                leaderId,
                club.Id,
                cancellationToken);

            if (!ownsAnotherActiveClub)
            {
                var leader = club.Memberships
                    .Select(membership => membership.User)
                    .Single(user => user.Id == leaderId);

                leader.DemoteToMember();
            }
        }

        repository.RemoveClub(club);
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> LeaveClubAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken)
    {
        var membership = await repository.GetApprovedMembershipAsync(clubId, currentUser.Id, cancellationToken);
        if (membership is null)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "You are not an active member of this club."));
        }

        if (membership.Role == ClubMembershipRole.President)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                "Club leaders cannot leave the club. Please transfer leadership or delete the club instead."));
        }

        membership.Status = ClubMembershipStatus.Inactive;
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    private async Task<ServiceResult<JoinRequestDto>> ReviewJoinRequestAsync(
        CurrentUserDto currentUser,
        Guid requestId,
        JoinRequestStatus nextStatus,
        CancellationToken cancellationToken)
    {
        var joinRequest = await repository.GetJoinRequestByIdForUpdateAsync(requestId, cancellationToken);
        if (joinRequest is null)
        {
            return NotFound<JoinRequestDto>("Join request was not found.");
        }

        var canReview = currentUser.IsAdmin ||
            await repository.UserOwnsClubAsync(joinRequest.ClubId, currentUser.Id, cancellationToken);
        if (!canReview)
        {
            return Forbidden<JoinRequestDto>();
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            return Conflict<JoinRequestDto>("Only pending join requests can be reviewed.");
        }

        if (nextStatus == JoinRequestStatus.Approved)
        {
            joinRequest.Approve(currentUser.Id, DateTimeOffset.UtcNow);
        }
        else
        {
            joinRequest.Reject(currentUser.Id, DateTimeOffset.UtcNow);
        }

        if (nextStatus == JoinRequestStatus.Approved)
        {
            await UpsertMembershipAsync(
                joinRequest.ClubId,
                joinRequest.UserId,
                ClubMembershipRole.Member,
                ClubMembershipStatus.Approved,
                currentUser.Id,
                cancellationToken);
        }

        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<JoinRequestDto>.Success(ToJoinRequestDto(joinRequest));
    }

    private async Task UpsertMembershipAsync(
        Guid clubId,
        Guid userId,
        ClubMembershipRole role,
        ClubMembershipStatus status,
        Guid approvedByUserId,
        CancellationToken cancellationToken)
    {
        var club = await repository.GetClubByIdForUpdateAsync(clubId, cancellationToken);
        var existingMembership = club?.Memberships.SingleOrDefault(membership => membership.UserId == userId);
        if (existingMembership is null)
        {
            await repository.AddClubMembershipAsync(
                ClubMembership.CreateReviewed(
                    clubId,
                    userId,
                    role,
                    status,
                    approvedByUserId,
                    DateTimeOffset.UtcNow),
                cancellationToken);
            return;
        }

        if (status == ClubMembershipStatus.Approved)
        {
            existingMembership.ApproveAs(role, approvedByUserId);
        }
        else
        {
            existingMembership.RejectAs(role, approvedByUserId);
        }
    }

    private static ClubProposalDto ToProposalDto(Club club)
    {
        return new ClubProposalDto(
            club.Id,
            club.Name,
            club.Slug,
            club.Category,
            club.Description ?? string.Empty,
            club.Status,
            club.CreatedByUserId,
            club.CreatedByUser?.DisplayName ?? "Unknown student",
            club.CreatedByUser?.Email,
            club.ImageKey,
            club.CreatedAt,
            club.UpdatedAt);
    }

    private static JoinRequestDto ToJoinRequestDto(JoinRequest joinRequest)
    {
        return new JoinRequestDto(
            joinRequest.Id,
            joinRequest.ClubId,
            joinRequest.Club.Name,
            joinRequest.UserId,
            joinRequest.User.DisplayName,
            joinRequest.User.Email,
            "Student",
            joinRequest.Message,
            joinRequest.Status,
            joinRequest.SubmittedAt,
            joinRequest.ReviewedAt);
    }

    private static JoinRequestDto ToJoinRequestDto(
        JoinRequest joinRequest,
        string clubName,
        CurrentUserDto currentUser)
    {
        return new JoinRequestDto(
            joinRequest.Id,
            joinRequest.ClubId,
            clubName,
            joinRequest.UserId,
            currentUser.DisplayName,
            currentUser.Email,
            "Student",
            joinRequest.Message,
            joinRequest.Status,
            joinRequest.SubmittedAt,
            joinRequest.ReviewedAt);
    }

    private static ServiceError? ValidateProposal(SubmitClubProposalRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors[nameof(request.Name)] = ["Club name is required."];
        }
        else if (request.Name.Trim().Length > 150)
        {
            errors[nameof(request.Name)] = ["Club name cannot exceed 150 characters."];
        }

        if (!string.IsNullOrWhiteSpace(request.Category) && request.Category.Trim().Length > 100)
        {
            errors[nameof(request.Category)] = ["Category cannot exceed 100 characters."];
        }

        if (string.IsNullOrWhiteSpace(request.Mission))
        {
            errors[nameof(request.Mission)] = ["Mission is required."];
        }
        else if (request.Mission.Trim().Length > 2000)
        {
            errors[nameof(request.Mission)] = ["Mission cannot exceed 2000 characters."];
        }

        if (!string.IsNullOrWhiteSpace(request.ImageKey) && request.ImageKey.Trim().Length > 100)
        {
            errors[nameof(request.ImageKey)] = ["Image key cannot exceed 100 characters."];
        }

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Club proposal data is invalid.", errors);
    }

    private static ServiceError ValidationError(string field, string message)
    {
        return new ServiceError(
            ServiceErrorType.Validation,
            "Club proposal data is invalid.",
            new Dictionary<string, string[]>
            {
                [field] = [message]
            });
    }

    private static ServiceResult<T> NotFound<T>(string message)
    {
        return ServiceResult<T>.Failure(new ServiceError(ServiceErrorType.NotFound, message));
    }

    private static ServiceResult<T> Conflict<T>(string message)
    {
        return ServiceResult<T>.Failure(new ServiceError(ServiceErrorType.Conflict, message));
    }

    private static ServiceResult<T> Forbidden<T>()
    {
        return ServiceResult<T>.Failure(ForbiddenError());
    }

    private static ServiceError ForbiddenError()
    {
        return new ServiceError(
            ServiceErrorType.Forbidden,
            "You do not have permission to perform this action.");
    }

    private static string NormalizeSlug(string value)
    {
        var normalized = Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-");
        return normalized.Trim('-');
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
