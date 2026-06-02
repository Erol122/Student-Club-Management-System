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
    Task<Announcement?> GetAnnouncementAsync(Guid id, CancellationToken cancellationToken);
    Task<Event?> GetEventAsync(Guid id, CancellationToken cancellationToken);
    Task AddAnnouncementAsync(Announcement announcement, CancellationToken cancellationToken);
    Task AddEventAsync(Event clubEvent, CancellationToken cancellationToken);
    void RemoveAnnouncement(Announcement announcement);
    void RemoveEvent(Event clubEvent);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
