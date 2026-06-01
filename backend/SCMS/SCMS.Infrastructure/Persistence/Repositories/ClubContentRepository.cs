using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SCMS.Application.ClubContent;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Infrastructure.Persistence.Repositories;

public sealed class ClubContentRepository(AppDbContext dbContext) : IClubContentRepository
{
    public async Task<IReadOnlyList<Announcement>> ListAnnouncementsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Announcements
            .AsNoTracking()
            .Include(announcement => announcement.CreatedByUser)
            .Where(announcement =>
                announcement.Status == AnnouncementStatus.Published &&
                announcement.Club.Status == ClubStatus.Active);

        if (!includeAllClubs)
        {
            query = query.Where(announcement =>
                announcement.Audience == AnnouncementAudience.Public ||
                announcement.Club.Memberships.Any(membership =>
                    membership.UserId == currentUserId &&
                    membership.Status == ClubMembershipStatus.Approved));
        }

        return await query
            .OrderByDescending(announcement => announcement.PublishedAt ?? announcement.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Event>> ListEventsAsync(
        Guid currentUserId,
        bool includeAllClubs,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Events
            .AsNoTracking()
            .Include(clubEvent => clubEvent.CreatedByUser)
            .Where(clubEvent =>
                clubEvent.Status == EventStatus.Published &&
                clubEvent.Club.Status == ClubStatus.Active);

        if (!includeAllClubs)
        {
            query = query.Where(clubEvent =>
                clubEvent.Visibility == EventVisibility.Public ||
                clubEvent.Club.Memberships.Any(membership =>
                    membership.UserId == currentUserId &&
                    membership.Status == ClubMembershipStatus.Approved));
        }

        return await query
            .OrderBy(clubEvent => clubEvent.StartAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ActiveClubExistsAsync(Guid clubId, CancellationToken cancellationToken)
    {
        return await dbContext.Clubs.AnyAsync(
            club => club.Id == clubId && club.Status == ClubStatus.Active,
            cancellationToken);
    }

    public async Task<bool> UserCanManageClubAsync(
        Guid clubId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClubMemberships.AnyAsync(
            membership =>
                membership.ClubId == clubId &&
                membership.UserId == userId &&
                membership.Status == ClubMembershipStatus.Approved &&
                membership.Role == ClubMembershipRole.President &&
                membership.Club.Status == ClubStatus.Active,
            cancellationToken);
    }

    public async Task AddAnnouncementAsync(Announcement announcement, CancellationToken cancellationToken)
    {
        await dbContext.Announcements.AddAsync(announcement, cancellationToken);
    }

    public async Task AddEventAsync(Event clubEvent, CancellationToken cancellationToken)
    {
        await dbContext.Events.AddAsync(clubEvent, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            throw new RelatedResourceNotFoundException("One or more referenced resources do not exist.");
        }
        catch (SqlException ex) when (IsDatabaseUnavailable(ex))
        {
            throw new PersistenceUnavailableException("The database is not available right now.", ex);
        }
    }

    private static bool IsForeignKeyViolation(DbUpdateException exception)
    {
        return exception.GetBaseException() is SqlException sqlException
            && sqlException.Number == 547;
    }

    private static bool IsDatabaseUnavailable(SqlException exception)
    {
        return exception.Number is -2 or 53 or 4060 or 10053 or 10054 or 10060 or 10061;
    }
}
