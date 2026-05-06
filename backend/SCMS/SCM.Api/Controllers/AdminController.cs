using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Users;

namespace SCM.Api.Controllers;

[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminController(IUserService userService) : ApiControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await userService.GetAllUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpPut("users/{userId:guid}/role")]
    public async Task<ActionResult<UserDto>> AssignUserRole(
        Guid userId,
        AssignUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await userService.AssignUserRoleAsync(userId, request.Role, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }
}
