using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Users;

namespace SCM.Api.Controllers;

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
