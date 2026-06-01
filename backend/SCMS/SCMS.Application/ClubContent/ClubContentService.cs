using SCMS.Application.Common;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubContent;

public sealed class ClubContentService(IClubContentRepository repository) : IClubContentService
{
    public async Task<ServiceResult<IReadOnlyList<ClubAnnouncementDto>>> GetAnnouncementsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken)
    {
        var announcements = await repository.ListAnnouncementsAsync(cancellationToken);
        return ServiceResult<IReadOnlyList<ClubAnnouncementDto>>.Success(
            announcements.Select(ToAnnouncementDto).ToList());
    }

    public async Task<ServiceResult<IReadOnlyList<ClubEventDto>>> GetEventsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken)
    {
        var events = await repository.ListEventsAsync(cancellationToken);
        return ServiceResult<IReadOnlyList<ClubEventDto>>.Success(
            events.Select(ToEventDto).ToList());
    }

    public async Task<ServiceResult<ClubAnnouncementDto>> CreateAnnouncementAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CreateAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateAnnouncement(request);
        if (validationError is not null)
        {
            return ServiceResult<ClubAnnouncementDto>.Failure(validationError);
        }

        var permissionError = await ValidateCanManageClubAsync(currentUser, clubId, cancellationToken);
        if (permissionError is not null)
        {
            return ServiceResult<ClubAnnouncementDto>.Failure(permissionError);
        }

        var now = DateTimeOffset.UtcNow;
        var announcement = new Announcement
        {
            ClubId = clubId,
            Title = request.Title.Trim(),
            Content = request.Body.Trim(),
            Audience = ParseAudience(request.Audience),
            Status = AnnouncementStatus.Published,
            PublishedAt = now,
            CreatedByUserId = currentUser.Id
        };

        await repository.AddAnnouncementAsync(announcement, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubAnnouncementDto>.Success(ToAnnouncementDto(announcement, currentUser.DisplayName));
    }

    public async Task<ServiceResult<ClubEventDto>> CreateEventAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateEvent(request);
        if (validationError is not null)
        {
            return ServiceResult<ClubEventDto>.Failure(validationError);
        }

        var permissionError = await ValidateCanManageClubAsync(currentUser, clubId, cancellationToken);
        if (permissionError is not null)
        {
            return ServiceResult<ClubEventDto>.Failure(permissionError);
        }

        var endAt = request.EndAt ?? request.StartAt.AddHours(1);
        var clubEvent = new Event
        {
            ClubId = clubId,
            Title = request.Title.Trim(),
            Description = NormalizeOptionalText(request.Description),
            Location = NormalizeOptionalText(request.Location),
            StartAt = request.StartAt,
            EndAt = endAt,
            Visibility = EventVisibility.ClubOnly,
            Status = EventStatus.Published,
            CreatedByUserId = currentUser.Id
        };

        await repository.AddEventAsync(clubEvent, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<ClubEventDto>.Success(ToEventDto(clubEvent, currentUser.DisplayName));
    }

    private async Task<ServiceError?> ValidateCanManageClubAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CancellationToken cancellationToken)
    {
        if (!await repository.ActiveClubExistsAsync(clubId, cancellationToken))
        {
            return new ServiceError(ServiceErrorType.NotFound, "Club was not found.");
        }

        if (currentUser.IsAdmin ||
            await repository.UserCanManageClubAsync(clubId, currentUser.Id, cancellationToken))
        {
            return null;
        }

        return ForbiddenError();
    }

    private static ServiceError? ValidateAnnouncement(CreateAnnouncementRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors[nameof(request.Title)] = ["Announcement title is required."];
        }
        else if (request.Title.Trim().Length > 200)
        {
            errors[nameof(request.Title)] = ["Announcement title cannot exceed 200 characters."];
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            errors[nameof(request.Body)] = ["Announcement message is required."];
        }
        else if (request.Body.Trim().Length > 4000)
        {
            errors[nameof(request.Body)] = ["Announcement message cannot exceed 4000 characters."];
        }

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Announcement data is invalid.", errors);
    }

    private static ServiceError? ValidateEvent(CreateEventRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors[nameof(request.Title)] = ["Event title is required."];
        }
        else if (request.Title.Trim().Length > 200)
        {
            errors[nameof(request.Title)] = ["Event title cannot exceed 200 characters."];
        }

        if (!string.IsNullOrWhiteSpace(request.Description) && request.Description.Trim().Length > 4000)
        {
            errors[nameof(request.Description)] = ["Event description cannot exceed 4000 characters."];
        }

        if (!string.IsNullOrWhiteSpace(request.Location) && request.Location.Trim().Length > 250)
        {
            errors[nameof(request.Location)] = ["Event location cannot exceed 250 characters."];
        }

        var endAt = request.EndAt ?? request.StartAt.AddHours(1);
        if (request.StartAt == default)
        {
            errors[nameof(request.StartAt)] = ["Event start date is required."];
        }
        else if (endAt <= request.StartAt)
        {
            errors[nameof(request.EndAt)] = ["Event end date must be after the start date."];
        }

        return errors.Count == 0
            ? null
            : new ServiceError(ServiceErrorType.Validation, "Event data is invalid.", errors);
    }

    private static ClubAnnouncementDto ToAnnouncementDto(Announcement announcement)
    {
        return ToAnnouncementDto(announcement, announcement.CreatedByUser.DisplayName);
    }

    private static ClubAnnouncementDto ToAnnouncementDto(Announcement announcement, string author)
    {
        return new ClubAnnouncementDto(
            announcement.Id,
            announcement.ClubId,
            announcement.Title,
            announcement.Content,
            ToAudienceLabel(announcement.Audience),
            author,
            announcement.PublishedAt ?? announcement.CreatedAt,
            announcement.CreatedAt);
    }

    private static ClubEventDto ToEventDto(Event clubEvent)
    {
        return ToEventDto(clubEvent, clubEvent.CreatedByUser.DisplayName);
    }

    private static ClubEventDto ToEventDto(Event clubEvent, string author)
    {
        return new ClubEventDto(
            clubEvent.Id,
            clubEvent.ClubId,
            clubEvent.Title,
            clubEvent.Description,
            clubEvent.Location,
            clubEvent.StartAt,
            clubEvent.EndAt,
            clubEvent.Status.ToString(),
            clubEvent.Visibility.ToString(),
            author,
            clubEvent.CreatedAt);
    }

    private static AnnouncementAudience ParseAudience(string? value)
    {
        return string.Equals(value, "Open to campus", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, "Public", StringComparison.OrdinalIgnoreCase)
                ? AnnouncementAudience.Public
                : AnnouncementAudience.Members;
    }

    private static string ToAudienceLabel(AnnouncementAudience audience)
    {
        return audience == AnnouncementAudience.Public ? "Open to campus" : "All members";
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ServiceError ForbiddenError()
    {
        return new ServiceError(
            ServiceErrorType.Forbidden,
            "You do not have permission to perform this action.");
    }
}
