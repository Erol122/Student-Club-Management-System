using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Common;

namespace SCM.Api.Controllers;

public static class ApiResultExtensions
{
    public static ActionResult ToActionResult(this ControllerBase controller, ServiceError error)
    {
        return error.Type switch
        {
            ServiceErrorType.Validation => controller.ValidationProblem(ToModelState(error)),
            ServiceErrorType.NotFound => controller.NotFound(new ProblemDetails
            {
                Title = "Resource not found",
                Detail = error.Message,
                Status = StatusCodes.Status404NotFound,
                Instance = controller.HttpContext.Request.Path
            }),
            ServiceErrorType.Conflict => controller.Conflict(new ProblemDetails
            {
                Title = "Conflict",
                Detail = error.Message,
                Status = StatusCodes.Status409Conflict,
                Instance = controller.HttpContext.Request.Path
            }),
            ServiceErrorType.Forbidden => controller.Forbid(),
            _ => controller.Problem(error.Message)
        };
    }

    public static bool TryGetCurrentUser(this ControllerBase controller, out SCMS.Application.Users.CurrentUserDto currentUser)
    {
        if (controller.HttpContext.Items["CurrentUser"] is SCMS.Application.Users.CurrentUserDto user)
        {
            currentUser = user;
            return true;
        }

        currentUser = null!;
        return false;
    }

    private static Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary ToModelState(ServiceError error)
    {
        var modelState = new Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary();
        if (error.Errors is null)
        {
            modelState.AddModelError(string.Empty, error.Message);
            return modelState;
        }

        foreach (var (field, messages) in error.Errors)
        {
            foreach (var message in messages)
            {
                modelState.AddModelError(field, message);
            }
        }

        return modelState;
    }
}
