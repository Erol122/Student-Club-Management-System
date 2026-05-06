using Microsoft.AspNetCore.Authorization;
using SCMS.Application.Users;

namespace SCM.Api.Authorization;

public sealed class AppRoleHandler(IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<AppRoleRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AppRoleRequirement requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.Items["CurrentUser"] is CurrentUserDto currentUser
            && requirement.AllowedRoles.Contains(currentUser.AppRole))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
