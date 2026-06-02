using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.Users;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Tests.TestDoubles;

internal static class TestData
{
    public static CurrentUserDto CurrentUser(
        AppRole role = AppRole.Member,
        Guid? id = null,
        string email = "student@example.edu",
        string displayName = "Student User")
    {
        return new CurrentUserDto(
            id ?? Guid.NewGuid(),
            $"entra-{Guid.NewGuid():N}",
            email,
            displayName,
            "Student",
            "User",
            ToRoleLabel(role),
            DateTimeOffset.UtcNow);
    }

    public static User User(
        AppRole role = AppRole.Member,
        Guid? id = null,
        string email = "student@example.edu",
        string displayName = "Student User")
    {
        return new User
        {
            Id = id ?? Guid.NewGuid(),
            EntraObjectId = $"entra-{Guid.NewGuid():N}",
            Email = email,
            DisplayName = displayName,
            FirstName = "Student",
            LastName = "User",
            Role = role,
            Status = UserStatus.Active,
            LastLoginAt = DateTimeOffset.UtcNow
        };
    }

    public static Club ActiveClub(string name = "Robotics Club", Guid? id = null)
    {
        return new Club
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
            Slug = Slugify(name),
            Description = "Build and learn together.",
            Category = "Engineering",
            Status = ClubStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
    }

    public static Club DraftClub(User proposer, string name = "Chess Club", Guid? id = null)
    {
        return new Club
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
            Slug = Slugify(name),
            Description = "Play chess on campus.",
            Category = "Games",
            Status = ClubStatus.Draft,
            CreatedByUserId = proposer.Id,
            CreatedByUser = proposer,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
    }

    public static ClubMembership AddMembership(
        Club club,
        User user,
        ClubMembershipRole role = ClubMembershipRole.Member,
        ClubMembershipStatus status = ClubMembershipStatus.Approved)
    {
        var membership = new ClubMembership
        {
            Id = Guid.NewGuid(),
            Club = club,
            ClubId = club.Id,
            User = user,
            UserId = user.Id,
            Role = role,
            Status = status,
            JoinedAt = DateTimeOffset.UtcNow.AddDays(-7),
            ApprovedByUserId = status == ClubMembershipStatus.Approved ? Guid.NewGuid() : null
        };

        club.Memberships.Add(membership);
        user.ClubMemberships.Add(membership);

        return membership;
    }

    public static JoinRequest PendingJoinRequest(Club club, User user, string? message = "I would like to join.")
    {
        return new JoinRequest
        {
            Id = Guid.NewGuid(),
            Club = club,
            ClubId = club.Id,
            User = user,
            UserId = user.Id,
            Message = message,
            Status = JoinRequestStatus.Pending,
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
    }

    public static ControllerContext ControllerContext(CurrentUserDto? currentUser = null, string path = "/api/test")
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = path;
        httpContext.RequestServices = new ServiceCollection()
            .AddLogging()
            .AddControllers()
            .Services
            .BuildServiceProvider();

        if (currentUser is not null)
        {
            httpContext.Items["CurrentUser"] = currentUser;
        }

        return new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    private static string ToRoleLabel(AppRole role)
    {
        return role switch
        {
            AppRole.Admin => UserRoleLabels.Admin,
            AppRole.ClubLeader => UserRoleLabels.ClubLeader,
            _ => UserRoleLabels.Member
        };
    }

    private static string Slugify(string value)
    {
        return value.Trim().ToLowerInvariant().Replace(' ', '-');
    }
}
