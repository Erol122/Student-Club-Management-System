using Microsoft.EntityFrameworkCore;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;
using SCMS.Infrastructure.Persistence;
using SCMS.Infrastructure.Persistence.Repositories;
using SCMS.Tests.TestDoubles;
using DomainEvent = SCMS.Domain.Entities.Event;

namespace SCMS.Tests.Infrastructure;

public sealed class RepositoryTests
{
    [Fact]
    public async Task ClubRepositoryListAsync_FiltersActiveOwnedClubsAndIncludesApprovedMembers()
    {
        await using var dbContext = CreateDbContext();
        var leader = TestData.User(AppRole.ClubLeader, displayName: "Leader User");
        var approvedMember = TestData.User(displayName: "Approved Member");
        var pendingMember = TestData.User(displayName: "Pending Member");
        var ownedClub = TestData.ActiveClub("Robotics Guild");
        ownedClub.Category = "Engineering";
        var otherClub = TestData.ActiveClub("Robotics Society");
        otherClub.Category = "Engineering";
        var draftClub = TestData.DraftClub(leader, "Draft Robotics");
        draftClub.Category = "Engineering";
        TestData.AddMembership(ownedClub, leader, ClubMembershipRole.President);
        TestData.AddMembership(ownedClub, approvedMember, ClubMembershipRole.Member);
        TestData.AddMembership(ownedClub, pendingMember, ClubMembershipRole.Member, ClubMembershipStatus.Pending);
        await dbContext.AddRangeAsync(leader, approvedMember, pendingMember, ownedClub, otherClub, draftClub);
        await dbContext.SaveChangesAsync();
        var repository = new ClubRepository(dbContext);

        var clubs = await repository.ListAsync(
            leader.Id,
            onlyOwnedClubs: true,
            search: "Robotics",
            category: "Engineering",
            CancellationToken.None);

        var club = Assert.Single(clubs);
        Assert.Equal(ownedClub.Id, club.Id);
        Assert.DoesNotContain(club.Memberships, membership => membership.Status != ClubMembershipStatus.Approved);
        Assert.Equal(2, club.Memberships.Count);
    }

    [Fact]
    public async Task ClubContentRepositoryListAnnouncementsAsync_ReturnsPublicAndMembershipScopedAnnouncements()
    {
        await using var dbContext = CreateDbContext();
        var member = TestData.User();
        var author = TestData.User(displayName: "Author");
        var joinedClub = TestData.ActiveClub("Joined Club");
        var otherClub = TestData.ActiveClub("Other Club");
        TestData.AddMembership(joinedClub, member, ClubMembershipRole.Member);
        var publicAnnouncement = AnnouncementFor(otherClub, author, "Campus Open", AnnouncementAudience.Public);
        var joinedAnnouncement = AnnouncementFor(joinedClub, author, "Members Update", AnnouncementAudience.Members);
        var privateOtherAnnouncement = AnnouncementFor(otherClub, author, "Private Other", AnnouncementAudience.Members);
        await dbContext.AddRangeAsync(
            member,
            author,
            joinedClub,
            otherClub,
            publicAnnouncement,
            joinedAnnouncement,
            privateOtherAnnouncement);
        await dbContext.SaveChangesAsync();
        var repository = new ClubContentRepository(dbContext);

        var announcements = await repository.ListAnnouncementsAsync(member.Id, includeAllClubs: false, CancellationToken.None);

        Assert.Equal(2, announcements.Count);
        Assert.Contains(announcements, announcement => announcement.Id == publicAnnouncement.Id);
        Assert.Contains(announcements, announcement => announcement.Id == joinedAnnouncement.Id);
        Assert.DoesNotContain(announcements, announcement => announcement.Id == privateOtherAnnouncement.Id);
    }

    [Fact]
    public async Task ClubWorkflowRepositoryListPendingJoinRequestsAsync_ReturnsRequestsForReviewerAndOwnedClubs()
    {
        await using var dbContext = CreateDbContext();
        var leader = TestData.User(AppRole.ClubLeader);
        var applicant = TestData.User(displayName: "Applicant");
        var otherApplicant = TestData.User(displayName: "Other Applicant");
        var ownedClub = TestData.ActiveClub("Owned Club");
        var otherClub = TestData.ActiveClub("Other Club");
        TestData.AddMembership(ownedClub, leader, ClubMembershipRole.President);
        var ownedClubRequest = TestData.PendingJoinRequest(ownedClub, applicant);
        var ownRequest = TestData.PendingJoinRequest(otherClub, leader);
        var hiddenRequest = TestData.PendingJoinRequest(otherClub, otherApplicant);
        await dbContext.AddRangeAsync(
            leader,
            applicant,
            otherApplicant,
            ownedClub,
            otherClub,
            ownedClubRequest,
            ownRequest,
            hiddenRequest);
        await dbContext.SaveChangesAsync();
        var repository = new ClubWorkflowRepository(dbContext);

        var requests = await repository.ListPendingJoinRequestsAsync(
            leader.Id,
            includeAllClubs: false,
            CancellationToken.None);

        Assert.Equal(2, requests.Count);
        Assert.Contains(requests, request => request.Id == ownedClubRequest.Id);
        Assert.Contains(requests, request => request.Id == ownRequest.Id);
        Assert.DoesNotContain(requests, request => request.Id == hiddenRequest.Id);
    }

    [Fact]
    public async Task ClubContentRepositoryListEventsAsync_ForAdminReturnsAllPublishedActiveClubEvents()
    {
        await using var dbContext = CreateDbContext();
        var admin = TestData.User(AppRole.Admin);
        var author = TestData.User(displayName: "Author");
        var activeClub = TestData.ActiveClub("Active Club");
        var archivedClub = TestData.ActiveClub("Archived Club");
        archivedClub.Status = ClubStatus.Archived;
        var activeEvent = EventFor(activeClub, author, "Active Event", EventStatus.Published);
        var draftEvent = EventFor(activeClub, author, "Draft Event", EventStatus.Draft);
        var archivedClubEvent = EventFor(archivedClub, author, "Archived Club Event", EventStatus.Published);
        await dbContext.AddRangeAsync(
            admin,
            author,
            activeClub,
            archivedClub,
            activeEvent,
            draftEvent,
            archivedClubEvent);
        await dbContext.SaveChangesAsync();
        var repository = new ClubContentRepository(dbContext);

        var events = await repository.ListEventsAsync(admin.Id, includeAllClubs: true, CancellationToken.None);

        var clubEvent = Assert.Single(events);
        Assert.Equal(activeEvent.Id, clubEvent.Id);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Announcement AnnouncementFor(
        Club club,
        User author,
        string title,
        AnnouncementAudience audience)
    {
        return new Announcement
        {
            Id = Guid.NewGuid(),
            Club = club,
            ClubId = club.Id,
            Title = title,
            Content = $"{title} content",
            Audience = audience,
            Status = AnnouncementStatus.Published,
            PublishedAt = DateTimeOffset.UtcNow,
            CreatedByUser = author,
            CreatedByUserId = author.Id
        };
    }

    private static DomainEvent EventFor(Club club, User author, string title, EventStatus status)
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);

        return new DomainEvent
        {
            Id = Guid.NewGuid(),
            Club = club,
            ClubId = club.Id,
            Title = title,
            StartAt = start,
            EndAt = start.AddHours(2),
            Status = status,
            Visibility = EventVisibility.Public,
            CreatedByUser = author,
            CreatedByUserId = author.Id
        };
    }
}
