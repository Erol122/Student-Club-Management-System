using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.ClubContent;
using SCMS.Application.ClubWorkflows;
using SCMS.Application.Clubs;
using SCMS.Application.Users;

namespace SCMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClubContentService, ClubContentService>();
        services.AddScoped<IClubService, ClubService>();
        services.AddScoped<IClubWorkflowService, ClubWorkflowService>();
        services.AddScoped<IUserService, UserService>();
        return services;
    }
}
