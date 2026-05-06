using SCMS.Application.Common;
using SCMS.Application.Common.Exceptions;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;

namespace SCMS.Application.Users;

public sealed class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<CurrentUserDto> GetOrCreateCurrentUserAsync(
        CurrentUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEntraObjectIdAsync(
            request.EntraObjectId,
            trackChanges: true,
            cancellationToken);

        if (user is null)
        {
            var isNewUser = true;
            user = new User
            {
                EntraObjectId = request.EntraObjectId,
                Email = NormalizeRequired(request.Email),
                DisplayName = NormalizeRequired(request.DisplayName),
                FirstName = NormalizeOptional(request.FirstName),
                LastName = NormalizeOptional(request.LastName),
                Role = AppRole.Member,
                Status = UserStatus.Active,
                LastLoginAt = DateTimeOffset.UtcNow
            };

            await userRepository.AddAsync(user, cancellationToken);

            try
            {
                await userRepository.SaveChangesAsync(cancellationToken);
            }
            catch (PersistenceConflictException) when (isNewUser)
            {
                user = await userRepository.GetByEntraObjectIdAsync(
                    request.EntraObjectId,
                    trackChanges: true,
                    cancellationToken)
                    ?? throw new PersistenceConflictException("The current user could not be loaded after creation conflict.");

                ApplyProfile(user, request);
                await userRepository.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            ApplyProfile(user, request);
            await userRepository.SaveChangesAsync(cancellationToken);
        }


        return ToDto(user);
    }

    private static void ApplyProfile(User user, CurrentUserRequest request)
    {
        user.Email = NormalizeRequired(request.Email);
        user.DisplayName = NormalizeRequired(request.DisplayName);
        user.FirstName = NormalizeOptional(request.FirstName);
        user.LastName = NormalizeOptional(request.LastName);
        user.LastLoginAt = DateTimeOffset.UtcNow;
    }

    private static CurrentUserDto ToDto(User user)
    {
        return new CurrentUserDto(
            user.Id,
            user.EntraObjectId,
            user.Email,
            user.DisplayName,
            user.FirstName,
            user.LastName,
            user.Role,
            ToDisplayRole(user.Role),
            user.LastLoginAt);
    }

    private static string ToDisplayRole(AppRole role)
    {
        return role switch
        {
            AppRole.Admin => "Admin",
            AppRole.ClubLeader => "Club Leader",
            _ => "Member"
        };
    }

    private static string NormalizeRequired(string value)
    {
        return string.IsNullOrWhiteSpace(value) ? "Unknown" : value.Trim();
    }

    public async Task<IReadOnlyList<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken)
    {
        var users = await userRepository.ListAsync(cancellationToken);
        return users.Select(ToUserDto).ToList();
    }

    public async Task<ServiceResult<UserDto>> AssignUserRoleAsync(
        Guid userId,
        AppRole role,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(role))
        {
            return ServiceResult<UserDto>.Failure(new ServiceError(
                ServiceErrorType.Validation,
                "User data is invalid.",
                new Dictionary<string, string[]>
                {
                    [nameof(role)] = ["Role is invalid."]
                }));
        }

        var user = await userRepository.GetByIdAsync(userId, trackChanges: true, cancellationToken);
        if (user is null)
        {
            return ServiceResult<UserDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "User was not found."));
        }

        user.Role = role;
        await userRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult<UserDto>.Success(ToUserDto(user));
    }

    private static UserDto ToUserDto(User user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.FirstName,
        user.LastName,
        user.Role,
        ToDisplayRole(user.Role),
        user.Status,
        user.LastLoginAt,
        user.CreatedAt);

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
