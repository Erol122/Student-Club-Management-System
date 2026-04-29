namespace SCMS.Application.Common.Exceptions;

public sealed class RelatedResourceNotFoundException(string message) : Exception(message);
