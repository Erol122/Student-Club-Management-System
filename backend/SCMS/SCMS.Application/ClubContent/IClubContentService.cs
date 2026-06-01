using SCMS.Application.Common;
using SCMS.Application.Users;

namespace SCMS.Application.ClubContent;

public interface IClubContentService
{
    Task<ServiceResult<IReadOnlyList<ClubAnnouncementDto>>> GetAnnouncementsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken);

    Task<ServiceResult<IReadOnlyList<ClubEventDto>>> GetEventsAsync(
        CurrentUserDto currentUser,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubAnnouncementDto>> CreateAnnouncementAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CreateAnnouncementRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubEventDto>> CreateEventAsync(
        CurrentUserDto currentUser,
        Guid clubId,
        CreateEventRequest request,
        CancellationToken cancellationToken);
}
