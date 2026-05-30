FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/InventorySystem.Api/InventorySystem.Api.csproj", "src/InventorySystem.Api/"]
COPY ["src/InventorySystem.Application/InventorySystem.Application.csproj", "src/InventorySystem.Application/"]
COPY ["src/InventorySystem.Domain/InventorySystem.Domain.csproj", "src/InventorySystem.Domain/"]
COPY ["src/InventorySystem.Infrastructure/InventorySystem.Infrastructure.csproj", "src/InventorySystem.Infrastructure/"]

RUN dotnet restore "src/InventorySystem.Api/InventorySystem.Api.csproj"

COPY . .
RUN dotnet publish "src/InventorySystem.Api/InventorySystem.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "InventorySystem.Api.dll"]
