namespace SCMS.Application.Common.Exceptions;

public sealed class PersistenceConflictException(string message) : Exception(message);
