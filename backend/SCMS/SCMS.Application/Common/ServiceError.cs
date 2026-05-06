namespace SCMS.Application.Common;

public enum ServiceErrorType
{
    Validation,
    NotFound,
    Conflict,
    Forbidden
}

public sealed record ServiceError(
    ServiceErrorType Type,
    string Message,
    IReadOnlyDictionary<string, string[]>? Errors = null);
