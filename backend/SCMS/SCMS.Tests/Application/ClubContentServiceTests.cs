using SCMS.Application.ClubContent;
using SCMS.Application.Common;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;
using DomainEvent = SCMS.Domain.Entities.Event;

namespace SCMS.Tests.Application;

public sealed class ClubContentServiceTests
{
    [Fact]
    public async Task GetAnnouncementsAsync_PassesUserScopeAndMapsAudienceLabels()
    {
        var author = TestData.User(displayName: "Club President");
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Meeting",
            Content = "Bring laptops.",
            Audience = AnnouncementAudience.Public,
            Status = AnnouncementStatus.Published,
            PublishedAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            CreatedByUser = author,
            CreatedByUserId = author.Id
        };
        var repository = new FakeClubContentRepository
        {
            Announcements = [announcement]
        };
        var admin = TestData.CurrentUser(AppRole.Admin);
        var service = new ClubContentService(repository);

        var result = await service.GetAnnouncementsAsync(admin, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(admin.Id, repository.LastAnnouncementsQuery?.CurrentUserId);
        Assert.True(repository.LastAnnouncementsQuery?.IncludeAllClubs);
        var dto = Assert.Single(result.Value!);
        Assert.Equal("Open to campus", dto.Audience);
        Assert.Equal("Club President", dto.Author);
        Assert.Equal("Bring laptops.", dto.Body);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_WhenRequestIsInvalid_ReturnsValidation()
    {
        var repository = new FakeClubContentRepository();
        var service = new ClubContentService(repository);

        var result = await service.CreateAnnouncementAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new CreateAnnouncementRequest("", "", null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Validation);
        Assert.Contains(nameof(CreateAnnouncementRequest.Title), result.Error!.Errors!.Keys);
        Assert.Contains(nameof(CreateAnnouncementRequest.Body), result.Error.Errors.Keys);
        Assert.Null(repository.AddedAnnouncement);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_WhenClubDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubContentRepository
        {
            ActiveClubExists = false
        };
        var service = new ClubContentService(repository);

        var result = await service.CreateAnnouncementAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new CreateAnnouncementRequest("Update", "Details", null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Null(repository.AddedAnnouncement);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_WhenUserCannotManageClub_ReturnsForbidden()
    {
        var repository = new FakeClubContentRepository
        {
            UserCanManageClub = false
        };
        var service = new ClubContentService(repository);

        var result = await service.CreateAnnouncementAsync(
            TestData.CurrentUser(AppRole.Member),
            Guid.NewGuid(),
            new CreateAnnouncementRequest("Update", "Details", null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Null(repository.AddedAnnouncement);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_WhenValid_TrimsAndPublishesAnnouncement()
    {
        var repository = new FakeClubContentRepository();
        var currentUser = TestData.CurrentUser(AppRole.Admin, displayName: "Admin User");
        var clubId = Guid.NewGuid();
        var service = new ClubContentService(repository);

        var result = await service.CreateAnnouncementAsync(
            currentUser,
            clubId,
            new CreateAnnouncementRequest("  Hack Night  ", "  Bring ideas.  ", "Public"),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(repository.AddedAnnouncement);
        Assert.Equal(clubId, repository.AddedAnnouncement.ClubId);
        Assert.Equal("Hack Night", repository.AddedAnnouncement.Title);
        Assert.Equal("Bring ideas.", repository.AddedAnnouncement.Content);
        Assert.Equal(AnnouncementAudience.Public, repository.AddedAnnouncement.Audience);
        Assert.Equal(AnnouncementStatus.Published, repository.AddedAnnouncement.Status);
        Assert.Equal(currentUser.Id, repository.AddedAnnouncement.CreatedByUserId);
        Assert.NotNull(repository.AddedAnnouncement.PublishedAt);
        Assert.Equal(1, repository.SaveChangesCount);
        Assert.Equal("Admin User", result.Value!.Author);
    }

    [Fact]
    public async Task CreateEventAsync_WhenEndIsBeforeStart_ReturnsValidation()
    {
        var repository = new FakeClubContentRepository();
        var service = new ClubContentService(repository);
        var start = DateTimeOffset.UtcNow.AddDays(1);

        var result = await service.CreateEventAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new CreateEventRequest("Workshop", null, null, start, start.AddMinutes(-1)),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Validation);
        Assert.Contains(nameof(CreateEventRequest.EndAt), result.Error!.Errors!.Keys);
        Assert.Null(repository.AddedEvent);
    }

    [Fact]
    public async Task CreateEventAsync_WhenUserCanManageClub_DefaultsEndTimeAndPublishesEvent()
    {
        var repository = new FakeClubContentRepository
        {
            UserCanManageClub = true
        };
        var leader = TestData.CurrentUser(AppRole.ClubLeader, displayName: "Leader User");
        var clubId = Guid.NewGuid();
        var start = DateTimeOffset.UtcNow.AddDays(3);
        var service = new ClubContentService(repository);

        var result = await service.CreateEventAsync(
            leader,
            clubId,
            new CreateEventRequest("  Workshop  ", "  Learn together.  ", "  Lab 1  ", start, null),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(repository.AddedEvent);
        Assert.Equal(clubId, repository.AddedEvent.ClubId);
        Assert.Equal("Workshop", repository.AddedEvent.Title);
        Assert.Equal("Learn together.", repository.AddedEvent.Description);
        Assert.Equal("Lab 1", repository.AddedEvent.Location);
        Assert.Equal(start, repository.AddedEvent.StartAt);
        Assert.Equal(start.AddHours(1), repository.AddedEvent.EndAt);
        Assert.Equal(EventStatus.Published, repository.AddedEvent.Status);
        Assert.Equal(EventVisibility.ClubOnly, repository.AddedEvent.Visibility);
        Assert.Equal(leader.Id, repository.AddedEvent.CreatedByUserId);
        Assert.Equal("Leader User", result.Value!.Author);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task GetEventsAsync_MapsCreatedByUserAndStatusValues()
    {
        var author = TestData.User(displayName: "Event Author");
        var clubEvent = new DomainEvent
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Demo Day",
            Description = "Show projects.",
            Location = "Auditorium",
            StartAt = DateTimeOffset.UtcNow.AddDays(4),
            EndAt = DateTimeOffset.UtcNow.AddDays(4).AddHours(2),
            Status = EventStatus.Published,
            Visibility = EventVisibility.Public,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CreatedByUser = author,
            CreatedByUserId = author.Id
        };
        var repository = new FakeClubContentRepository
        {
            Events = [clubEvent]
        };
        var member = TestData.CurrentUser(AppRole.Member);
        var service = new ClubContentService(repository);

        var result = await service.GetEventsAsync(member, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(member.Id, repository.LastEventsQuery?.CurrentUserId);
        Assert.False(repository.LastEventsQuery?.IncludeAllClubs);
        var dto = Assert.Single(result.Value!);
        Assert.Equal("Published", dto.Status);
        Assert.Equal("Public", dto.Visibility);
        Assert.Equal("Event Author", dto.Author);
    }

    // ── UpdateAnnouncementAsync ───────────────────────────────────────────────

    [Fact]
    public async Task UpdateAnnouncementAsync_WhenAnnouncementDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubContentRepository { AnnouncementToReturn = null };
        var service = new ClubContentService(repository);

        var result = await service.UpdateAnnouncementAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new UpdateAnnouncementRequest("New Title", "New body", null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateAnnouncementAsync_WhenUserCannotManageClub_ReturnsForbidden()
    {
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Old Title",
            Content = "Old body",
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            AnnouncementToReturn = announcement,
            UserCanManageClub = false
        };
        var service = new ClubContentService(repository);

        var result = await service.UpdateAnnouncementAsync(
            TestData.CurrentUser(AppRole.Member),
            announcement.Id,
            new UpdateAnnouncementRequest("New Title", "New body", null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Equal("Old Title", announcement.Title);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateAnnouncementAsync_WhenValid_TrimsFieldsAndSaves()
    {
        var author = TestData.User(displayName: "Club Leader");
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Old Title",
            Content = "Old body",
            Audience = AnnouncementAudience.Members,
            CreatedByUser = author
        };
        var repository = new FakeClubContentRepository
        {
            AnnouncementToReturn = announcement,
            UserCanManageClub = true
        };
        var service = new ClubContentService(repository);

        var result = await service.UpdateAnnouncementAsync(
            TestData.CurrentUser(AppRole.ClubLeader),
            announcement.Id,
            new UpdateAnnouncementRequest("  Updated Title  ", "  Updated body.  ", "Public"),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("Updated Title", announcement.Title);
        Assert.Equal("Updated body.", announcement.Content);
        Assert.Equal(AnnouncementAudience.Public, announcement.Audience);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    // ── DeleteAnnouncementAsync ───────────────────────────────────────────────

    [Fact]
    public async Task DeleteAnnouncementAsync_WhenAnnouncementDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubContentRepository { AnnouncementToReturn = null };
        var service = new ClubContentService(repository);

        var result = await service.DeleteAnnouncementAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task DeleteAnnouncementAsync_WhenUserCannotManageClub_ReturnsForbidden()
    {
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            AnnouncementToReturn = announcement,
            UserCanManageClub = false
        };
        var service = new ClubContentService(repository);

        var result = await service.DeleteAnnouncementAsync(
            TestData.CurrentUser(AppRole.Member),
            announcement.Id,
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Null(repository.RemovedAnnouncement);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task DeleteAnnouncementAsync_WhenValid_RemovesAndSaves()
    {
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            AnnouncementToReturn = announcement,
            UserCanManageClub = true
        };
        var service = new ClubContentService(repository);

        var result = await service.DeleteAnnouncementAsync(
            TestData.CurrentUser(AppRole.ClubLeader),
            announcement.Id,
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Same(announcement, repository.RemovedAnnouncement);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    // ── UpdateEventAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateEventAsync_WhenEventDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubContentRepository { EventToReturn = null };
        var service = new ClubContentService(repository);
        var start = DateTimeOffset.UtcNow.AddDays(1);

        var result = await service.UpdateEventAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            new UpdateEventRequest("Workshop", null, null, start, null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateEventAsync_WhenUserCannotManageClub_ReturnsForbidden()
    {
        var clubEvent = new DomainEvent
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Old Title",
            StartAt = DateTimeOffset.UtcNow.AddDays(2),
            EndAt = DateTimeOffset.UtcNow.AddDays(2).AddHours(1),
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            EventToReturn = clubEvent,
            UserCanManageClub = false
        };
        var service = new ClubContentService(repository);
        var start = DateTimeOffset.UtcNow.AddDays(3);

        var result = await service.UpdateEventAsync(
            TestData.CurrentUser(AppRole.Member),
            clubEvent.Id,
            new UpdateEventRequest("New Title", null, null, start, null),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Equal("Old Title", clubEvent.Title);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateEventAsync_WhenValid_UpdatesFieldsAndDefaultsEndTime()
    {
        var author = TestData.User(displayName: "Leader");
        var clubEvent = new DomainEvent
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            Title = "Old Title",
            Location = "Old Room",
            StartAt = DateTimeOffset.UtcNow.AddDays(1),
            EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1),
            CreatedByUser = author
        };
        var repository = new FakeClubContentRepository
        {
            EventToReturn = clubEvent,
            UserCanManageClub = true
        };
        var service = new ClubContentService(repository);
        var newStart = DateTimeOffset.UtcNow.AddDays(5);

        var result = await service.UpdateEventAsync(
            TestData.CurrentUser(AppRole.ClubLeader),
            clubEvent.Id,
            new UpdateEventRequest("  Workshop  ", "  Details.  ", "  Lab 2  ", newStart, null),
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("Workshop", clubEvent.Title);
        Assert.Equal("Details.", clubEvent.Description);
        Assert.Equal("Lab 2", clubEvent.Location);
        Assert.Equal(newStart, clubEvent.StartAt);
        Assert.Equal(newStart.AddHours(1), clubEvent.EndAt);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    // ── DeleteEventAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteEventAsync_WhenEventDoesNotExist_ReturnsNotFound()
    {
        var repository = new FakeClubContentRepository { EventToReturn = null };
        var service = new ClubContentService(repository);

        var result = await service.DeleteEventAsync(
            TestData.CurrentUser(AppRole.Admin),
            Guid.NewGuid(),
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.NotFound);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task DeleteEventAsync_WhenUserCannotManageClub_ReturnsForbidden()
    {
        var clubEvent = new DomainEvent
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            StartAt = DateTimeOffset.UtcNow.AddDays(1),
            EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1),
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            EventToReturn = clubEvent,
            UserCanManageClub = false
        };
        var service = new ClubContentService(repository);

        var result = await service.DeleteEventAsync(
            TestData.CurrentUser(AppRole.Member),
            clubEvent.Id,
            CancellationToken.None);

        AssertFailure(result, ServiceErrorType.Forbidden);
        Assert.Null(repository.RemovedEvent);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task DeleteEventAsync_WhenValid_RemovesAndSaves()
    {
        var clubEvent = new DomainEvent
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            StartAt = DateTimeOffset.UtcNow.AddDays(1),
            EndAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(1),
            CreatedByUser = TestData.User()
        };
        var repository = new FakeClubContentRepository
        {
            EventToReturn = clubEvent,
            UserCanManageClub = true
        };
        var service = new ClubContentService(repository);

        var result = await service.DeleteEventAsync(
            TestData.CurrentUser(AppRole.ClubLeader),
            clubEvent.Id,
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Same(clubEvent, repository.RemovedEvent);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    private static void AssertFailure<T>(ServiceResult<T> result, ServiceErrorType errorType)
    {
        Assert.False(result.Succeeded);
        Assert.NotNull(result.Error);
        Assert.Equal(errorType, result.Error.Type);
    }

    private static void AssertFailure(ServiceResult result, ServiceErrorType errorType)
    {
        Assert.False(result.Succeeded);
        Assert.NotNull(result.Error);
        Assert.Equal(errorType, result.Error.Type);
    }
}
