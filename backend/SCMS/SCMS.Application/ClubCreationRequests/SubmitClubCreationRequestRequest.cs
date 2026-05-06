namespace SCMS.Application.ClubCreationRequests;

public sealed record SubmitClubCreationRequestRequest(
    string ClubName,
    string? ClubDescription,
    string? ClubCategory,
    string? Message);
