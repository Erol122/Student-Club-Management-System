namespace SCMS.Application.Users;

public sealed record CurrentUserDto(
    Guid Id,
    string EntraObjectId,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName,
    string Role,
    DateTimeOffset? LastLoginAt)
{
    public bool IsAdmin => string.Equals(Role, UserRoleLabels.Admin, StringComparison.OrdinalIgnoreCase);
    public bool IsClubLeader => string.Equals(Role, UserRoleLabels.ClubLeader, StringComparison.OrdinalIgnoreCase);
}
