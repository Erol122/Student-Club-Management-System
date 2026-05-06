using SCMS.Application.Common;

namespace SCMS.Application.ClubMemberships;

public interface IClubMembershipService
{
    Task<IReadOnlyList<ClubMembershipDto>> GetClubMembersAsync(Guid clubId, CancellationToken cancellationToken);
    Task<ServiceResult<ClubMembershipDto>> AssignMemberRoleAsync(Guid clubId, Guid userId, AssignMemberRoleRequest request, CancellationToken cancellationToken);
    Task<ServiceResult> RemoveMemberAsync(Guid clubId, Guid userId, CancellationToken cancellationToken);
}
