using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Clubs;
using SCMS.Application.Common;

namespace SCM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ClubsController(IClubService clubService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClubDto>>> GetClubs(
        [FromQuery] string? search,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var clubs = await clubService.GetClubsAsync(search, category, cancellationToken);
        return Ok(clubs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClubDto>> GetClub(Guid id, CancellationToken cancellationToken)
    {
        var club = await clubService.GetClubAsync(id, cancellationToken);
        return club is null ? NotFound() : Ok(club);
    }

    [HttpPost]
    public async Task<ActionResult<ClubDto>> CreateClub(
        CreateClubRequest request,
        CancellationToken cancellationToken)
    {
        var result = await clubService.CreateClubAsync(request, cancellationToken);
        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        return CreatedAtAction(nameof(GetClub), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClubDto>> UpdateClub(
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken)
    {
        var result = await clubService.UpdateClubAsync(id, request, cancellationToken);
        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteClub(Guid id, CancellationToken cancellationToken)
    {
        var result = await clubService.DeleteClubAsync(id, cancellationToken);
        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        return NoContent();
    }

    private ActionResult ToActionResult(ServiceError error)
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
