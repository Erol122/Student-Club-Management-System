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

                if (ApplyProfile(user, request))
                {
                    await userRepository.SaveChangesAsync(cancellationToken);
                }
            }
        }
        else
        {
            if (ApplyProfile(user, request))
            {
                await userRepository.SaveChangesAsync(cancellationToken);
            }
        }


        return ToDto(user);
    }

    private static bool ApplyProfile(User user, CurrentUserRequest request)
    {
        var email = NormalizeRequired(request.Email);
        var displayName = NormalizeRequired(request.DisplayName);
        var firstName = NormalizeOptional(request.FirstName);
        var lastName = NormalizeOptional(request.LastName);

        var changed = false;

        if (user.Email != email)
        {
            user.Email = email;
            changed = true;
        }

        if (user.DisplayName != displayName)
        {
            user.DisplayName = displayName;
            changed = true;
        }

        if (user.FirstName != firstName)
        {
            user.FirstName = firstName;
            changed = true;
        }

        if (user.LastName != lastName)
        {
            user.LastName = lastName;
            changed = true;
        }

        return changed;
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

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
