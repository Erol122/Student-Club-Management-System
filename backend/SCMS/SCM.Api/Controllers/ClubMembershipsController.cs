using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Application.ClubMemberships;

namespace SCM.Api.Controllers;

[Route("api/clubs/{clubId:guid}/members")]
public sealed class ClubMembershipsController(IClubMembershipService clubMembershipService) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClubMembershipDto>>> GetMembers(
        Guid clubId,
        CancellationToken cancellationToken)
    {
        var members = await clubMembershipService.GetClubMembersAsync(clubId, cancellationToken);
        return Ok(members);
    }

    [HttpPut("{userId:guid}/role")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ClubMembershipDto>> AssignMemberRole(
        Guid clubId,
        Guid userId,
        AssignMemberRoleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await clubMembershipService.AssignMemberRoleAsync(clubId, userId, request, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return Ok(result.Value);
    }

    [HttpDelete("{userId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RemoveMember(
        Guid clubId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await clubMembershipService.RemoveMemberAsync(clubId, userId, cancellationToken);
        if (!result.Succeeded) return ToActionResult(result.Error!);

        return NoContent();
    }
}
