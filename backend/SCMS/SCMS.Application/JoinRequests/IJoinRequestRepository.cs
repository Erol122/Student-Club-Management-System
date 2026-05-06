using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.JoinRequests;

public interface IJoinRequestRepository
{
    Task<JoinRequest?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken);
    Task<IReadOnlyList<JoinRequest>> ListByClubAsync(Guid clubId, JoinRequestStatus? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<JoinRequest>> ListByUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> HasActivePendingRequestAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);
    Task AddAsync(JoinRequest joinRequest, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
