using SCMS.Application.Common;
using SCMS.Domain.Enums;

namespace SCMS.Application.Users;

public interface IUserService
{
    Task<CurrentUserDto> GetOrCreateCurrentUserAsync(
        CurrentUserRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken);
    Task<ServiceResult<UserDto>> AssignUserRoleAsync(Guid userId, AppRole role, CancellationToken cancellationToken);
}
