var builder = DistributedApplication.CreateBuilder(args);

var scmsDatabase = builder.AddConnectionString("scmsdb");
var frontendPath = Path.GetFullPath(
    Path.Combine(builder.Environment.ContentRootPath, "..", "..", "..", "frontend"));

var migrationService = builder.AddProject<Projects.SCMS_MigrationService>("scms-migrationservice")
    .WithReference(scmsDatabase);

var api = builder.AddProject<Projects.SCM_Api>("scm-api")
    .WithReference(scmsDatabase)
    .WaitForCompletion(migrationService);

builder.AddExecutable("scms-frontend", "npm", frontendPath, "start")
    .WithHttpEndpoint(targetPort: 3000, env: "PORT")
    .WithEnvironment("HOST", "0.0.0.0")
    .WithEnvironment("BROWSER", "none")
    .WithEnvironment("REACT_APP_API_BASE_URL", api.GetEndpoint("http"))
    .WaitFor(api);

builder.Build().Run();
