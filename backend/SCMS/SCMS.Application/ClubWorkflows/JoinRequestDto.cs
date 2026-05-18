using SCMS.Domain.Enums;

namespace SCMS.Application.ClubWorkflows;

public sealed record JoinRequestDto(
    Guid Id,
    Guid ClubId,
    string ClubName,
    Guid UserId,
    string Student,
    string Email,
    string Program,
    string? Reason,
    JoinRequestStatus Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ReviewedAt);
