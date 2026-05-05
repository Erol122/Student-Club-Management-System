namespace SCMS.Application.Common;

public sealed class ServiceResult
{
    private ServiceResult(ServiceError? error)
    {
        Error = error;
    }

    public ServiceError? Error { get; }

    public bool Succeeded => Error is null;

    public static ServiceResult Success()
    {
        return new ServiceResult(null);
    }

    public static ServiceResult Failure(ServiceError error)
    {
        return new ServiceResult(error);
    }
}

public sealed class ServiceResult<T>
{
    private ServiceResult(T? value, ServiceError? error)
    {
        Value = value;
        Error = error;
    }

    public T? Value { get; }
    public ServiceError? Error { get; }

    public bool Succeeded => Error is null;

    public static ServiceResult<T> Success(T value)
    {
        return new ServiceResult<T>(value, null);
    }

    public static ServiceResult<T> Failure(ServiceError error)
    {
        return new ServiceResult<T>(default, error);
    }
}
