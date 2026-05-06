using System.Security.Claims;
using SCMS.Application.Users;

namespace SCM.Api.Middleware;

public sealed class CurrentUserProvisioningMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        IUserService userService,
        ILogger<CurrentUserProvisioningMiddleware> logger)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var entraObjectId = GetClaimValue(
            context.User,
            "oid",
            "http://schemas.microsoft.com/identity/claims/objectidentifier");

        if (string.IsNullOrWhiteSpace(entraObjectId))
        {
            logger.LogWarning("Authenticated token did not include an Entra object id claim.");
            await next(context);
            return;
        }

        var email = GetClaimValue(
            context.User,
            "upn",
            "unique_name",
            "preferred_username",
            ClaimTypes.Upn,
            ClaimTypes.Email) ?? $"{entraObjectId}@unknown.local";

        var displayName = GetClaimValue(context.User, "name", ClaimTypes.Name) ?? email;
        var firstName = GetClaimValue(context.User, "given_name", ClaimTypes.GivenName);
        var lastName = GetClaimValue(context.User, "family_name", ClaimTypes.Surname);

        var currentUser = await userService.GetOrCreateCurrentUserAsync(
            new CurrentUserRequest(entraObjectId, email, displayName, firstName, lastName),
            context.RequestAborted);

        context.Items["CurrentUser"] = currentUser;

        await next(context);
    }

    private static string? GetClaimValue(ClaimsPrincipal user, params string[] claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            var value = user.FindFirstValue(claimType);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
