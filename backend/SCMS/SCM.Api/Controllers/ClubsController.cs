using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.Clubs;

namespace SCM.Api.Controllers;

[Route("api/[controller]")]
public sealed class ClubsController(IClubService clubService) : ApiControllerBase
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
    [Authorize(Policy = "ClubLeaderOrAdmin")]
    public async Task<ActionResult<ClubDto>> CreateClub(
        CreateClubRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var requestWithUser = request with { CreatedByUserId = currentUser.Id };
        var result = await clubService.CreateClubAsync(requestWithUser, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return CreatedAtAction(nameof(GetClub), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ClubLeaderOrAdmin")]
    public async Task<ActionResult<ClubDto>> UpdateClub(
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken)
    {
        var result = await clubService.UpdateClubAsync(id, request, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteClub(Guid id, CancellationToken cancellationToken)
    {
        var result = await clubService.DeleteClubAsync(id, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return NoContent();
    }
}
