namespace SCMS.Application.ClubWorkflows;

public sealed record SubmitClubProposalRequest(
    string Name,
    string? Category,
    string Mission);
