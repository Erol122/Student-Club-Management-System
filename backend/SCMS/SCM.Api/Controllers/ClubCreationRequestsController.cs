using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.ClubCreationRequests;
using SCMS.Domain.Enums;

namespace SCM.Api.Controllers;

[Route("api/club-creation-requests")]
public sealed class ClubCreationRequestsController(IClubCreationRequestService clubCreationRequestService)
    : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<IReadOnlyList<ClubCreationRequestDto>>> GetAll(
        [FromQuery] ClubCreationRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var requests = await clubCreationRequestService.GetAllRequestsAsync(status, cancellationToken);
        return Ok(requests);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<ClubCreationRequestDto>>> GetMine(
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var requests = await clubCreationRequestService.GetMyRequestsAsync(currentUser.Id, cancellationToken);
        return Ok(requests);
    }

    [HttpPost]
    public async Task<ActionResult<ClubCreationRequestDto>> Submit(
        SubmitClubCreationRequestRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await clubCreationRequestService.SubmitAsync(currentUser.Id, request, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPost("{requestId:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ClubCreationRequestDto>> Approve(
        Guid requestId,
        ReviewClubCreationRequestRequest review,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await clubCreationRequestService.ApproveAsync(requestId, currentUser.Id, review, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpPost("{requestId:guid}/reject")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ClubCreationRequestDto>> Reject(
        Guid requestId,
        ReviewClubCreationRequestRequest review,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await clubCreationRequestService.RejectAsync(requestId, currentUser.Id, review, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpDelete("{requestId:guid}")]
    public async Task<IActionResult> Cancel(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await clubCreationRequestService.CancelAsync(requestId, currentUser.Id, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return NoContent();
    }
}
