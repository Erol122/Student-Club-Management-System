using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Users;

namespace SCMS.Api.Controllers;

[ApiController]
[Route("api/me")]
public sealed class MeController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        if (HttpContext.Items["CurrentUser"] is CurrentUserDto provisionedUser)
        {
            return Ok(provisionedUser);
        }

        var entraObjectId = GetClaimValue("oid", "http://schemas.microsoft.com/identity/claims/objectidentifier");
        if (string.IsNullOrWhiteSpace(entraObjectId))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Missing Entra object id",
                Detail = "The access token does not include an object id claim.",
                Status = StatusCodes.Status401Unauthorized,
                Instance = HttpContext.Request.Path
            });
        }

        var email = GetClaimValue(
            "upn",
            "unique_name",
            "preferred_username",
            ClaimTypes.Upn,
            ClaimTypes.Email) ?? $"{entraObjectId}@unknown.local";

        var displayName = GetClaimValue("name", ClaimTypes.Name) ?? email;
        var firstName = GetClaimValue("given_name", ClaimTypes.GivenName);
        var lastName = GetClaimValue("family_name", ClaimTypes.Surname);

        var currentUser = await userService.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest(entraObjectId, email, displayName, firstName, lastName),
            cancellationToken);

        return Ok(currentUser);
    }

    private string? GetClaimValue(params string[] claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            var value = User.FindFirstValue(claimType);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
