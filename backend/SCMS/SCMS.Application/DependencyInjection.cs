using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.Clubs;

namespace SCMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClubService, ClubService>();
        return services;
    }
}
