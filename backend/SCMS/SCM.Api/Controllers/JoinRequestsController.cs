using Microsoft.AspNetCore.Mvc;
using SCMS.Application.ClubWorkflows;

namespace SCM.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class JoinRequestsController(IClubWorkflowService clubWorkflowService) : ControllerBase
{
    [HttpGet("join-requests/pending")]
    public async Task<ActionResult<IReadOnlyList<JoinRequestDto>>> GetPending(CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.GetPendingJoinRequestsAsync(currentUser, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpPost("clubs/{clubId:guid}/join-requests")]
    public async Task<ActionResult<JoinRequestDto>> Submit(
        Guid clubId,
        SubmitJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.SubmitJoinRequestAsync(
            currentUser,
            clubId,
            request,
            cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult(result.Error!);
        }

        return CreatedAtAction(nameof(GetPending), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("join-requests/{requestId:guid}/approve")]
    public async Task<ActionResult<JoinRequestDto>> Approve(Guid requestId, CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.ApproveJoinRequestAsync(currentUser, requestId, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpPost("join-requests/{requestId:guid}/reject")]
    public async Task<ActionResult<JoinRequestDto>> Reject(Guid requestId, CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.RejectJoinRequestAsync(currentUser, requestId, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpDelete("clubs/{clubId:guid}/members/me")]
    public async Task<IActionResult> LeaveClub(Guid clubId, CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.LeaveClubAsync(currentUser, clubId, cancellationToken);
        return result.Succeeded ? NoContent() : this.ToActionResult(result.Error!);
    }
}
