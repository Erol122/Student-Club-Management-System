using SCMS.Domain.Enums;

namespace SCMS.Application.Users;

public sealed record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName,
    AppRole AppRole,
    string Role,
    UserStatus Status,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt);
