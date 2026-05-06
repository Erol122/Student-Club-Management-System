using SCMS.Application.Common;
using SCMS.Domain.Enums;

namespace SCMS.Application.ClubMemberships;

public sealed class ClubMembershipService(IClubMembershipRepository clubMembershipRepository) : IClubMembershipService
{
    public async Task<IReadOnlyList<ClubMembershipDto>> GetClubMembersAsync(
        Guid clubId,
        CancellationToken cancellationToken)
    {
        var memberships = await clubMembershipRepository.ListByClubAsync(clubId, cancellationToken);
        return memberships.Select(ToDto).ToList();
    }

    public async Task<ServiceResult<ClubMembershipDto>> AssignMemberRoleAsync(
        Guid clubId,
        Guid userId,
        AssignMemberRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Role))
        {
            return ServiceResult<ClubMembershipDto>.Failure(new ServiceError(
                ServiceErrorType.Validation,
                "Membership data is invalid.",
                new Dictionary<string, string[]>
                {
                    [nameof(request.Role)] = ["Membership role is invalid."]
                }));
        }

        var membership = await clubMembershipRepository.GetByClubAndUserAsync(
            clubId, userId, trackChanges: true, cancellationToken);

        if (membership is null || membership.Status != ClubMembershipStatus.Approved)
        {
            return ServiceResult<ClubMembershipDto>.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Active membership was not found for this user in this club."));
        }

        membership.Role = request.Role;
        await clubMembershipRepository.SaveChangesAsync(cancellationToken);

        var updated = await clubMembershipRepository.GetByClubAndUserAsync(
            clubId, userId, trackChanges: false, cancellationToken);
        return ServiceResult<ClubMembershipDto>.Success(ToDto(updated!));
    }

    public async Task<ServiceResult> RemoveMemberAsync(
        Guid clubId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var membership = await clubMembershipRepository.GetByClubAndUserAsync(
            clubId, userId, trackChanges: true, cancellationToken);

        if (membership is null || membership.Status != ClubMembershipStatus.Approved)
        {
            return ServiceResult.Failure(new ServiceError(
                ServiceErrorType.NotFound,
                "Active membership was not found for this user in this club."));
        }

        membership.Status = ClubMembershipStatus.Inactive;
        await clubMembershipRepository.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    private static ClubMembershipDto ToDto(Domain.Entities.ClubMembership m) => new(
        m.Id,
        m.ClubId,
        m.Club.Name,
        m.UserId,
        m.User.DisplayName,
        m.User.Email,
        m.Role,
        m.Status,
        m.JoinedAt,
        m.ApprovedByUserId,
        m.CreatedAt,
        m.UpdatedAt);
}
