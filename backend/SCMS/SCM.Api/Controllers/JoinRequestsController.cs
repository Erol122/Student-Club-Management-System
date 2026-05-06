using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.JoinRequests;
using SCMS.Domain.Enums;

namespace SCM.Api.Controllers;

[Route("api")]
public sealed class JoinRequestsController(IJoinRequestService joinRequestService) : ApiControllerBase
{
    [HttpGet("clubs/{clubId:guid}/join-requests")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<IReadOnlyList<JoinRequestDto>>> GetClubJoinRequests(
        Guid clubId,
        [FromQuery] JoinRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var requests = await joinRequestService.GetClubJoinRequestsAsync(clubId, status, cancellationToken);
        return Ok(requests);
    }

    [HttpGet("me/join-requests")]
    public async Task<ActionResult<IReadOnlyList<JoinRequestDto>>> GetMyJoinRequests(
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var requests = await joinRequestService.GetUserJoinRequestsAsync(currentUser.Id, cancellationToken);
        return Ok(requests);
    }

    [HttpPost("clubs/{clubId:guid}/join-requests")]
    public async Task<ActionResult<JoinRequestDto>> SubmitJoinRequest(
        Guid clubId,
        SubmitJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await joinRequestService.SubmitJoinRequestAsync(clubId, currentUser.Id, request, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPost("join-requests/{requestId:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<JoinRequestDto>> ApproveJoinRequest(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await joinRequestService.ApproveJoinRequestAsync(requestId, currentUser.Id, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpPost("join-requests/{requestId:guid}/reject")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<JoinRequestDto>> RejectJoinRequest(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await joinRequestService.RejectJoinRequestAsync(requestId, currentUser.Id, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpDelete("join-requests/{requestId:guid}")]
    public async Task<IActionResult> CancelJoinRequest(
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        if (currentUser is null) return Unauthorized();

        var result = await joinRequestService.CancelJoinRequestAsync(requestId, currentUser.Id, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return NoContent();
    }
}
