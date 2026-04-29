using System.Text.RegularExpressions;
using SCMS.Application.Common;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.Clubs;

public sealed class ClubService(IClubRepository clubRepository) : IClubService
{
    public async Task<IReadOnlyList<ClubDto>> GetClubsAsync(
        string? search,
        string? category,
        CancellationToken cancellationToken)
    {
        var clubs = await clubRepository.ListAsync(search, category, cancellationToken);
        return clubs.Select(ToDto).ToList();
    }

    public async Task<ClubDto?> GetClubAsync(Guid id, CancellationToken cancellationToken)
    {
        var club = await clubRepository.GetByIdAsync(id, trackChanges: false, cancellationToken);
        return club is null ? null : ToDto(club);
    }

    public async Task<ServiceResult<ClubDto>> CreateClubAsync(
        CreateClubRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
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

        var club = new Club
        {
            Name = request.Name.Trim(),
            Slug = slugResult.Value!,
            Description = NormalizeOptionalText(request.Description),
            Category = NormalizeOptionalText(request.Category),
            Status = request.Status,
            CreatedByUserId = null
        };

        await clubRepository.AddAsync(club, cancellationToken);
        await clubRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubDto>.Success(ToDto(club));
    }

    public async Task<ServiceResult<ClubDto>> UpdateClubAsync(
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
            request.Status);
        if (validationError is not null)
        {
            return ServiceResult<ClubDto>.Failure(validationError);
        }

        var club = await clubRepository.GetByIdAsync(id, trackChanges: true, cancellationToken);
        if (club is null)
        {
            return ServiceResult<ClubDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Club was not found."));
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

        club.Name = request.Name.Trim();
        club.Slug = slugResult.Value!;
        club.Description = NormalizeOptionalText(request.Description);
        club.Category = NormalizeOptionalText(request.Category);
        club.Status = request.Status;
        club.CreatedByUserId = createdByUserId;

        await clubRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubDto>.Success(ToDto(club));
    }

    public async Task<ServiceResult> DeleteClubAsync(Guid id, CancellationToken cancellationToken)
    {
        var club = await clubRepository.GetByIdAsync(id, trackChanges: true, cancellationToken);
        if (club is null)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Club was not found."));
        }

        clubRepository.Remove(club);
        await clubRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
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

        if (!Enum.IsDefined(status))
        {
            errors[nameof(status)] = ["Club status is invalid."];
        }

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Club data is invalid.", errors);
    }

    private static ClubDto ToDto(Club club)
    {
        return new ClubDto(
            club.Id,
            club.Name,
            club.Slug,
            club.Description,
            club.Category,
            club.Status,
            club.CreatedByUserId,
            club.CreatedAt,
            club.UpdatedAt);
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
