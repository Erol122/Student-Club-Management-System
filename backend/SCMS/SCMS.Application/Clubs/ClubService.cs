using System.Text.RegularExpressions;
using SCMS.Application.Common;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

public sealed class ClubService(IClubRepository clubRepository) : IClubService
{
    public async Task<IReadOnlyList<ClubDto>> GetClubsAsync(
        CurrentUserDto currentUser,
        string? search,
        string? category,
        CancellationToken cancellationToken)
    {
        var clubs = await clubRepository.ListAsync(
            currentUser.Id,
            currentUser.IsClubLeader,
            search,
            category,
            cancellationToken);
        return clubs.Select(ToDto).ToList();
    }

    public async Task<ClubDto?> GetClubAsync(
        CurrentUserDto currentUser,
        Guid id,
        CancellationToken cancellationToken)
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            currentUser.Id,
            currentUser.IsClubLeader,
            cancellationToken);
        return club is null ? null : ToDto(club);
    }

    public async Task<ServiceResult<ClubDto>> CreateClubAsync(
        CurrentUserDto currentUser,
        CreateClubRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return ServiceResult<ClubDto>.Failure(ForbiddenError());
        }

        var validationError = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
            request.ImageKey,
            request.GroupPlatform,
            request.GroupLink,
            request.Status);
        if (validationError is not null)
        {
            return ServiceResult<ClubDto>.Failure(validationError);
        }

        var slugResult = await ValidateSlugAsync(request.Slug, request.Name, ignoredClubId: null, cancellationToken);
        if (!slugResult.Succeeded)
        {
            return ServiceResult<ClubDto>.Failure(slugResult.Error!);
        }

        var club = Club.CreateManaged(
            request.Name.Trim(),
            slugResult.Value!,
            NormalizeOptionalText(request.Description),
            NormalizeOptionalText(request.Category),
            NormalizeOptionalText(request.ImageKey),
            NormalizeOptionalText(request.GroupPlatform),
            NormalizeOptionalText(request.GroupLink),
            request.Status,
            createdByUserId: null);

        await clubRepository.AddAsync(club, cancellationToken);
        await clubRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubDto>.Success(ToDto(club));
    }

    public async Task<ServiceResult<ClubDto>> UpdateClubAsync(
        CurrentUserDto currentUser,
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken)
    {
        var club = await clubRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (club is null)
        {
            return ServiceResult<ClubDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Club was not found."));
        }

        var canManageClub = currentUser.IsAdmin || IsPresidentOfClub(club, currentUser.Id);
        if (!canManageClub)
        {
            return ServiceResult<ClubDto>.Failure(ForbiddenError());
        }

        if (!currentUser.IsAdmin)
        {
            var groupLinkError = ValidateGroupLink(request.GroupLink);
            if (groupLinkError is not null)
            {
                return ServiceResult<ClubDto>.Failure(groupLinkError);
            }

            var groupLink = NormalizeOptionalText(request.GroupLink);
            club.UpdateDetails(
                club.Name,
                club.Slug,
                club.Description,
                club.Category,
                club.ImageKey,
                groupLink is null ? null : "WhatsApp",
                groupLink,
                club.Status,
                club.CreatedByUserId);

            await clubRepository.SaveChangesAsync(cancellationToken);

            return ServiceResult<ClubDto>.Success(ToDto(club));
        }

        var validationError = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
            request.ImageKey,
            request.GroupPlatform,
            request.GroupLink,
            request.Status);
        if (validationError is not null)
        {
            return ServiceResult<ClubDto>.Failure(validationError);
        }

        var slugResult = await ValidateSlugAsync(request.Slug, request.Name, id, cancellationToken);
        if (!slugResult.Succeeded)
        {
            return ServiceResult<ClubDto>.Failure(slugResult.Error!);
        }

        var createdByUserId = NormalizeOptionalUserId(request.CreatedByUserId);
        if (createdByUserId.HasValue &&
            !await clubRepository.UserExistsAsync(createdByUserId.Value, cancellationToken))
        {
            return ServiceResult<ClubDto>.Failure(ValidationError(
                nameof(request.CreatedByUserId),
                "CreatedByUserId must reference an existing user."));
        }

        club.UpdateDetails(
            request.Name.Trim(),
            slugResult.Value!,
            NormalizeOptionalText(request.Description),
            NormalizeOptionalText(request.Category),
            NormalizeOptionalText(request.ImageKey),
            club.GroupPlatform,
            club.GroupLink,
            request.Status,
            createdByUserId);

        await clubRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubDto>.Success(ToDto(club));
    }

    private static bool IsPresidentOfClub(Club club, Guid userId)
    {
        return club.Memberships.Any(membership =>
            membership.UserId == userId &&
            membership.Status == ClubMembershipStatus.Approved &&
            membership.Role == ClubMembershipRole.President);
    }

    private async Task<ServiceResult<string>> ValidateSlugAsync(
        string? requestedSlug,
        string name,
        Guid? ignoredClubId,
        CancellationToken cancellationToken)
    {
        var slug = NormalizeSlug(requestedSlug, name);
        if (string.IsNullOrWhiteSpace(slug))
        {
            return ServiceResult<string>.Failure(ValidationError(
                nameof(CreateClubRequest.Slug),
                "Slug must contain at least one letter or number."));
        }

        if (await clubRepository.SlugExistsAsync(slug, ignoredClubId, cancellationToken))
        {
            return ServiceResult<string>.Failure(new ServiceError(
                ServiceErrorType.Conflict,
                "A club with this slug already exists."));
        }

        return ServiceResult<string>.Success(slug);
    }

    private static ServiceError? ValidateRequest(
        string name,
        string? slug,
        string? description,
        string? category,
        string? imageKey,
        string? groupPlatform,
        string? groupLink,
        ClubStatus status)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors[nameof(name)] = ["Club name is required."];
        }
        else if (name.Trim().Length > 150)
        {
            errors[nameof(name)] = ["Club name cannot exceed 150 characters."];
        }

        if (!string.IsNullOrWhiteSpace(slug) && slug.Trim().Length > 150)
        {
            errors[nameof(slug)] = ["Slug cannot exceed 150 characters."];
        }

        if (!string.IsNullOrWhiteSpace(description) && description.Trim().Length > 2000)
        {
            errors[nameof(description)] = ["Description cannot exceed 2000 characters."];
        }

        if (!string.IsNullOrWhiteSpace(category) && category.Trim().Length > 100)
        {
            errors[nameof(category)] = ["Category cannot exceed 100 characters."];
        }

        if (!string.IsNullOrWhiteSpace(groupPlatform) && groupPlatform.Trim().Length > 100)
        {
            errors[nameof(groupPlatform)] = ["Group platform cannot exceed 100 characters."];
        }

        if (!string.IsNullOrWhiteSpace(imageKey) && imageKey.Trim().Length > 100)
        {
            errors[nameof(imageKey)] = ["Image key cannot exceed 100 characters."];
        }

        if (!string.IsNullOrWhiteSpace(groupLink) && groupLink.Trim().Length > 500)
        {
            errors[nameof(groupLink)] = ["Group link cannot exceed 500 characters."];
        }

        if (!Enum.IsDefined(status))
        {
            errors[nameof(status)] = ["Club status is invalid."];
        }

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Club data is invalid.", errors);
    }

    private static ServiceError? ValidateGroupLink(string? groupLink)
    {
        if (!string.IsNullOrWhiteSpace(groupLink) && groupLink.Trim().Length > 500)
        {
            return ValidationError(nameof(groupLink), "Group link cannot exceed 500 characters.");
        }

        return null;
    }

    private static ClubDto ToDto(Club club)
    {
        var members = club.Memberships
            .Where(membership => membership.Status == ClubMembershipStatus.Approved)
            .OrderByDescending(membership => membership.Role)
            .ThenBy(membership => membership.User.DisplayName)
            .Select(membership => new ClubMemberDto(
                membership.Id,
                membership.UserId,
                membership.User.DisplayName,
                membership.User.Email,
                membership.Role,
                membership.Status,
                membership.JoinedAt))
            .ToList();

        return new ClubDto(
            club.Id,
            club.Name,
            club.Slug,
            club.Description,
            club.Category,
            club.ImageKey,
            club.GroupPlatform,
            club.GroupLink,
            club.Status,
            club.CreatedByUserId,
            club.CreatedAt,
            club.UpdatedAt,
            members);
    }

    private static ServiceError ValidationError(string field, string message)
    {
        return new ServiceError(
            ServiceErrorType.Validation,
            "Club data is invalid.",
            new Dictionary<string, string[]>
            {
                [field] = [message]
            });
    }

    private static ServiceError ForbiddenError()
    {
        return new ServiceError(
            ServiceErrorType.Forbidden,
            "You do not have permission to perform this action.");
    }

    private static string NormalizeSlug(string? slug, string name)
    {
        var source = string.IsNullOrWhiteSpace(slug) ? name : slug;
        var normalized = Regex.Replace(source.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-");
        return normalized.Trim('-');
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Guid? NormalizeOptionalUserId(Guid? userId)
    {
        return userId is null || userId == Guid.Empty ? null : userId;
    }
}
