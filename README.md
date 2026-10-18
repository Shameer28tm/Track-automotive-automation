# Track Automotive Automation

Track Automotive Automation is a garage and vehicle-service management application built with ASP.NET Core 8, C#, Entity Framework Core, and SQL Server.

## Current scope

The existing codebase includes role-oriented workflows for administrators, customers, and mechanics; vehicle and service records; appointments; fault tracking; notifications; and AI-related chat interfaces. Availability and correctness of each feature must be validated against the running application.

## Technology

- .NET 8 / ASP.NET Core MVC
- C# 12
- Entity Framework Core
- SQL Server
- Razor views, CSS, and JavaScript

## Getting started

### Prerequisites

- .NET 8 SDK
- SQL Server or SQL Server LocalDB
- Git

### Restore and build

```powershell
dotnet restore .\GarageManagementSystem.sln
dotnet build .\GarageManagementSystem.sln
```

### Configure the database

Review `GarageManagementSystem/appsettings.json` and use local development configuration or environment variables for your connection string and all external service credentials. Do not commit real secrets.

The default configuration uses SQL Server LocalDB. Make sure LocalDB is installed before running migrations.

### Apply migrations

Install a compatible Entity Framework Core CLI tool if required, then run:

```powershell
dotnet ef database update --project .\GarageManagementSystem\GarageManagementSystem.csproj
```

Only run migrations against a local development database that you control.

### Run the application

```powershell
dotnet run --project .\GarageManagementSystem\GarageManagementSystem.csproj
```

Open the local URL printed by the application. The launch settings currently configure HTTP on port 5000 and HTTPS on port 7000; the output from `dotnet run` is authoritative.

## Configuration and security

External integrations may require API credentials for AI services, email, or messaging. Configure them outside source control. Placeholder values do not represent working credentials. Review authorization, account seeding, and any default credentials before exposing the application to a network.

## Repository hygiene

Build artifacts, local secrets, IDE-specific caches, and installed dependency directories should not be committed. Keep the existing third-party license files with the assets they cover.

## License

This project includes third-party dependencies and assets, each of which may have its own license. See the root `LICENSE` file and individual third-party license notices.
