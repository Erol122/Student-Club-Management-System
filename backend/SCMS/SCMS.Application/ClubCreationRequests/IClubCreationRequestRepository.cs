using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubCreationRequests;

public interface IClubCreationRequestRepository
{
    Task<ClubCreationRequest?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken);
    Task<IReadOnlyList<ClubCreationRequest>> ListAsync(ClubCreationRequestStatus? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<ClubCreationRequest>> ListByUserAsync(Guid userId, CancellationToken cancellationToken);
    Task AddAsync(ClubCreationRequest request, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
