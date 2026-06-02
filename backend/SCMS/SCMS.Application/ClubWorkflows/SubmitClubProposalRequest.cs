namespace SCMS.Application.ClubWorkflows;

public sealed record SubmitClubProposalRequest(
    string Name,
    string? Category,
    string Mission,
    string? ImageKey = null);
