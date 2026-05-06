using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SCMS.Application.ClubCreationRequests;
using SCMS.Application.ClubMemberships;
using SCMS.Application.Clubs;
using SCMS.Application.JoinRequests;
using SCMS.Application.Users;
using SCMS.Infrastructure.Persistence;
using SCMS.Infrastructure.Persistence.Repositories;

namespace SCMS.Infrastructure;

public static class DependencyInjection
{
    private const string ConnectionStringName = "scmsdb";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(ConnectionStringName)
            ?? throw new InvalidOperationException(
                $"Connection string '{ConnectionStringName}' was not found.");

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlServerOptions =>
            {
                sqlServerOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                sqlServerOptions.EnableRetryOnFailure();
            });
        });

        services.AddScoped<IClubRepository, ClubRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJoinRequestRepository, JoinRequestRepository>();
        services.AddScoped<IClubMembershipRepository, ClubMembershipRepository>();
        services.AddScoped<IClubCreationRequestRepository, ClubCreationRequestRepository>();

        return services;
    }
}
