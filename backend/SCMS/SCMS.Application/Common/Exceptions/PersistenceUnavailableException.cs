namespace SCMS.Application.Common.Exceptions;

public sealed class PersistenceUnavailableException(string message, Exception innerException)
    : Exception(message, innerException);
