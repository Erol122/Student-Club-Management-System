using SCMS.Domain.Entities;

namespace SCMS.Application.ClubContent;

public interface IClubContentRepository
{
    Task<IReadOnlyList<Announcement>> ListAnnouncementsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Event>> ListEventsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken);
    Task<bool> ActiveClubExistsAsync(Guid clubId, CancellationToken cancellationToken);
    Task<bool> UserCanManageClubAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);
    Task AddAnnouncementAsync(Announcement announcement, CancellationToken cancellationToken);
    Task AddEventAsync(Event clubEvent, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
