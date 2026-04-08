var builder = DistributedApplication.CreateBuilder(args);

var scmsDatabase = builder.AddConnectionString("scmsdb");

var migrationService = builder.AddProject<Projects.SCMS_MigrationService>("scms-migrationservice")
    .WithReference(scmsDatabase);

builder.AddProject<Projects.SCM_Api>("scm-api")
    .WithReference(scmsDatabase)
    .WaitForCompletion(migrationService);

builder.Build().Run();
