using SCMS.Domain.Entities;

namespace SCMS.Application.ClubMemberships;

public interface IClubMembershipRepository
{
    Task<IReadOnlyList<ClubMembership>> ListByClubAsync(Guid clubId, CancellationToken cancellationToken);
    Task<ClubMembership?> GetByClubAndUserAsync(Guid clubId, Guid userId, bool trackChanges, CancellationToken cancellationToken);
    Task AddAsync(ClubMembership membership, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
