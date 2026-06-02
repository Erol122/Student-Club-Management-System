using Microsoft.AspNetCore.Mvc;
using SCMS.Application.ClubWorkflows;

namespace SCM.Api.Controllers;

[ApiController]
[Route("api/club-proposals")]
public sealed class ClubProposalsController(IClubWorkflowService clubWorkflowService) : ControllerBase
{
    [HttpGet("pending")]
    public async Task<ActionResult<IReadOnlyList<ClubProposalDto>>> GetPending(CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.GetPendingClubProposalsAsync(currentUser, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpPost]
    public async Task<ActionResult<ClubProposalDto>> Submit(
        SubmitClubProposalRequest request,
        CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.SubmitClubProposalAsync(currentUser, request, cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult(result.Error!);
        }

        return CreatedAtAction(nameof(GetPending), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{clubId:guid}/approve")]
    public async Task<ActionResult<ClubProposalDto>> Approve(Guid clubId, CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.ApproveClubProposalAsync(currentUser, clubId, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }

    [HttpPost("{clubId:guid}/reject")]
    public async Task<ActionResult<ClubProposalDto>> Reject(Guid clubId, CancellationToken cancellationToken)
    {
        if (!this.TryGetCurrentUser(out var currentUser))
        {
            return Unauthorized();
        }

        var result = await clubWorkflowService.RejectClubProposalAsync(currentUser, clubId, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : this.ToActionResult(result.Error!);
    }
}
