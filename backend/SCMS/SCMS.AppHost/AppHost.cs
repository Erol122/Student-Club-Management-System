var builder = DistributedApplication.CreateBuilder(args);

var sqlServer = builder.AddSqlServer("sql")
    .WithImageTag("2022-latest")
    .WithDataVolume("scms-sqlserver-2022-data");
var scmsDatabase = sqlServer.AddDatabase("scmsdb", "SCMS");
var frontendPath = Path.GetFullPath(
    Path.Combine(builder.Environment.ContentRootPath, "..", "..", "..", "frontend"));

var migrationService = builder.AddProject<Projects.SCMS_MigrationService>("scms-migrationservice")
    .WithReference(scmsDatabase)
    .WaitFor(scmsDatabase);

var api = builder.AddProject<Projects.SCM_Api>("scm-api")
    .WithReference(scmsDatabase)
    .WaitFor(scmsDatabase)
    .WaitForCompletion(migrationService);

builder.AddExecutable("scms-frontend", "npm", frontendPath, "start")
    .WithHttpEndpoint(port: 5173, targetPort: 5173, env: "PORT", isProxied: false)
    .WithEnvironment("HOST", "0.0.0.0")
    .WithEnvironment("BROWSER", "none")
    .WithEnvironment("REACT_APP_API_BASE_URL", "http://localhost:5205")
    .WaitFor(api);
    
builder.Build().Run();
