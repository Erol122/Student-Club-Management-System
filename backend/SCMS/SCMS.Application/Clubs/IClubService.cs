using SCMS.Application.Common;
using SCMS.Application.Users;

namespace SCMS.Application.Clubs;

public interface IClubService
{
    Task<IReadOnlyList<ClubDto>> GetClubsAsync(
        CurrentUserDto currentUser,
        string? search,
        string? category,
        CancellationToken cancellationToken);

    Task<ClubDto?> GetClubAsync(
        CurrentUserDto currentUser,
        Guid id,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubDto>> CreateClubAsync(
        CurrentUserDto currentUser,
        CreateClubRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResult<ClubDto>> UpdateClubAsync(
        CurrentUserDto currentUser,
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken);
}
