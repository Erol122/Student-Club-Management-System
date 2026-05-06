using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.Clubs;
using SCMS.Application.Users;

namespace SCMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClubService, ClubService>();
        services.AddScoped<IUserService, UserService>();
        return services;
    }
}
