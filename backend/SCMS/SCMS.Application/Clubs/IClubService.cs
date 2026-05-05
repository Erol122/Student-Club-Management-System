using SCMS.Application.Common;

namespace SCMS.Application.Clubs;

public interface IClubService
{
    Task<IReadOnlyList<ClubDto>> GetClubsAsync(
        string? search,
        string? category,
        CancellationToken cancellationToken);

    Task<ClubDto?> GetClubAsync(Guid id, CancellationToken cancellationToken);

    Task<ServiceResult<ClubDto>> CreateClubAsync(
        CreateClubRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubDto>> UpdateClubAsync(
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult> DeleteClubAsync(Guid id, CancellationToken cancellationToken);
}
