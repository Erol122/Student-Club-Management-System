using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.ClubCreationRequests;
using SCMS.Application.ClubMemberships;
using SCMS.Application.Clubs;
using SCMS.Application.JoinRequests;
using SCMS.Application.Users;

namespace SCMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClubService, ClubService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IJoinRequestService, JoinRequestService>();
        services.AddScoped<IClubMembershipService, ClubMembershipService>();
        services.AddScoped<IClubCreationRequestService, ClubCreationRequestService>();
        return services;
    }
}
