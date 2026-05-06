namespace SCMS.Application.Users;

public sealed record CurrentUserDto(
    Guid Id,
    string EntraObjectId,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName,
    string Role,
    DateTimeOffset? LastLoginAt);
