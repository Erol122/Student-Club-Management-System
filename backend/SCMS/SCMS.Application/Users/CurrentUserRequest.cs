namespace SCMS.Application.Users;

public sealed record CurrentUserRequest(
    string EntraObjectId,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName);
