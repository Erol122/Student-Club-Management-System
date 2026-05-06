using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Users;

namespace SCMS.Api.Controllers;

[ApiController]
[Route("api/me")]
public sealed class MeController : ControllerBase
{
    [HttpGet]
    public ActionResult<CurrentUserDto> GetCurrentUser()
    {
        return HttpContext.Items["CurrentUser"] is CurrentUserDto currentUser
            ? Ok(currentUser)
            : Unauthorized();
    }
}
