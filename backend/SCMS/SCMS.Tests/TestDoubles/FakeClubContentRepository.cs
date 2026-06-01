using SCMS.Application.ClubContent;
using SCMS.Domain.Entities;

namespace SCMS.Tests.TestDoubles;

internal sealed class FakeClubContentRepository : IClubContentRepository
{
    public IReadOnlyList<Announcement> Announcements { get; set; } = [];
    public IReadOnlyList<Event> Events { get; set; } = [];
    public bool ActiveClubExists { get; set; } = true;
    public bool UserCanManageClub { get; set; }
    public Announcement? AddedAnnouncement { get; private set; }
    public Event? AddedEvent { get; private set; }
    public int SaveChangesCount { get; private set; }
    public (Guid CurrentUserId, bool IncludeAllClubs)? LastAnnouncementsQuery { get; private set; }
    public (Guid CurrentUserId, bool IncludeAllClubs)? LastEventsQuery { get; private set; }

    public Task<IReadOnlyList<Announcement>> ListAnnouncementsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        LastAnnouncementsQuery = (currentUserId, includeAllClubs);
        return Task.FromResult(Announcements);
    }

    public Task<IReadOnlyList<Event>> ListEventsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        LastEventsQuery = (currentUserId, includeAllClubs);
        return Task.FromResult(Events);
    }

    public Task<bool> ActiveClubExistsAsync(Guid clubId, CancellationToken cancellationToken)
    {
        return Task.FromResult(ActiveClubExists);
    }

    public Task<bool> UserCanManageClubAsync(Guid clubId, Guid userId, CancellationToken cancellationToken)
    {
        return Task.FromResult(UserCanManageClub);
    }

    public Task AddAnnouncementAsync(Announcement announcement, CancellationToken cancellationToken)
    {
        AddedAnnouncement = announcement;
        return Task.CompletedTask;
    }

    public Task AddEventAsync(Event clubEvent, CancellationToken cancellationToken)
    {
        AddedEvent = clubEvent;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveChangesCount++;
        return Task.CompletedTask;
    }
}
