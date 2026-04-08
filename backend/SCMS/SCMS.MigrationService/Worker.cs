using Microsoft.EntityFrameworkCore;
using SCMS.Infrastructure.Persistence;

namespace SCMS.MigrationService;

public sealed class Worker(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime applicationLifetime,
    ILogger<Worker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var migrations = await dbContext.Database.GetMigrationsAsync(stoppingToken);

            if (migrations.Any())
            {
                logger.LogInformation("Applying Entity Framework migrations to the SCMS database.");
                await dbContext.Database.MigrateAsync(stoppingToken);
            }
            else
            {
                logger.LogInformation(
                    "No Entity Framework migrations were found. Ensuring the SCMS database exists.");
                await dbContext.Database.EnsureCreatedAsync(stoppingToken);
            }

            logger.LogInformation("Database preparation completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database preparation failed.");
            throw;
        }
        finally
        {
            applicationLifetime.StopApplication();
        }
    }
}
