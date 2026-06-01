using Microsoft.AspNetCore.Mvc;
using SCMS.Application.ClubContent;

namespace SCM.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class ClubContentController(IClubContentService clubContentService) : ControllerBase
{
    [HttpGet("announcements")]
    public async Task<ActionResult<IReadOnlyList<ClubAnnouncementDto>>> GetAnnouncements(
        CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubContentService.GetAnnouncementsAsync(currentUser, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpGet("events")]
    public async Task<ActionResult<IReadOnlyList<ClubEventDto>>> GetEvents(CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubContentService.GetEventsAsync(currentUser, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpPost("clubs/{clubId:guid}/announcements")]
    public async Task<ActionResult<ClubAnnouncementDto>> CreateAnnouncement(
        Guid clubId,
        CreateAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubContentService.CreateAnnouncementAsync(
            currentUser,
            clubId,
            request,
            cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult(result.Error!);
        }

        return CreatedAtAction(nameof(GetAnnouncements), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("clubs/{clubId:guid}/events")]
    public async Task<ActionResult<ClubEventDto>> CreateEvent(
        Guid clubId,
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubContentService.CreateEventAsync(
            currentUser,
            clubId,
            request,
            cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult(result.Error!);
        }

        return CreatedAtAction(nameof(GetEvents), new { id = result.Value!.Id }, result.Value);
    }
}
