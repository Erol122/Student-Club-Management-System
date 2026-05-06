namespace SCMS.Application.Users;

public interface IUserService
{
    Task<CurrentUserDto> GetOrCreateCurrentUserAsync(
        CurrentUserRequest request,
        CancellationToken cancellationToken);
}
