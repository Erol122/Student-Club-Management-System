using Microsoft.AspNetCore.Authorization;
using SCMS.Domain.Enums;

namespace SCM.Api.Authorization;

public sealed class AppRoleRequirement(params AppRole[] allowedRoles) : IAuthorizationRequirement
{
    public IReadOnlyList<AppRole> AllowedRoles { get; } = allowedRoles;
}
