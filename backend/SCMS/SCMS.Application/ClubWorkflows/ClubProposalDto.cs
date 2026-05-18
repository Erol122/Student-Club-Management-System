using SCMS.Domain.Enums;

namespace SCMS.Application.ClubWorkflows;

public sealed record ClubProposalDto(
    Guid Id,
    string Name,
    string Slug,
    string? Category,
    string Mission,
    ClubStatus Status,
    Guid? ProposedByUserId,
    string ProposedBy,
    string? ProposedByEmail,
    DateTimeOffset SubmittedAt,
    DateTimeOffset UpdatedAt);
