using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Common;
using SCMS.Application.Users;

namespace SCM.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected CurrentUserDto? GetCurrentUser()
        => HttpContext.Items["CurrentUser"] as CurrentUserDto;

    protected ActionResult ToActionResult(ServiceError error)
    {
        return error.Type switch
        {
            ServiceErrorType.Validation => ToValidationProblem(error),
            ServiceErrorType.NotFound => NotFound(new ProblemDetails
            {
                Title = "Resource not found",
                Detail = error.Message,
                Status = StatusCodes.Status404NotFound,
                Instance = HttpContext.Request.Path
            }),
            ServiceErrorType.Conflict => Conflict(new ProblemDetails
            {
                Title = "Conflict",
                Detail = error.Message,
                Status = StatusCodes.Status409Conflict,
                Instance = HttpContext.Request.Path
            }),
            ServiceErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = error.Message,
                Status = StatusCodes.Status403Forbidden,
                Instance = HttpContext.Request.Path
            }),
            _ => Problem(error.Message)
        };
    }

    private ActionResult ToValidationProblem(ServiceError error)
    {
        if (error.Errors is not null)
        {
            foreach (var (field, messages) in error.Errors)
            {
                foreach (var message in messages)
                {
                    ModelState.AddModelError(field, message);
                }
            }
        }

        return ValidationProblem(ModelState);
    }
}
