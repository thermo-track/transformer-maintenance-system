# TMS Backend Docker Setup

This directory contains all the necessary files to dockerize the TMS Backend Spring Boot application.

## Files Overview

- **Dockerfile**: Multi-stage Docker build file for the Spring Boot application
- **.dockerignore**: Specifies files to exclude from Docker build context
- **docker-compose.yml**: Complete setup with PostgreSQL database
- **application-docker.properties**: Spring Boot configuration for Docker environment
- **docker-build.sh**: Linux/Mac build script
- **docker-build.bat**: Windows build script

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

This starts both the Spring Boot application and PostgreSQL database:

```bash
# Windows
docker-build.bat compose-up

# Linux/Mac
./docker-build.sh compose-up
```

### Option 2: Build and Run Manually

```bash
# Windows
docker-build.bat build-and-run

# Linux/Mac
./docker-build.sh build-and-run
```

## Environment Variables

The application uses the following environment variables:

- `SPRING_PROFILES_ACTIVE`: Set to "docker" for containerized environment
- `DB_URL`: PostgreSQL database URL
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `INFERENCE_API_URL`: External inference API URL

## Ports

- **Application**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **PostgreSQL**: localhost:5432 (when using docker-compose)

## Available Commands

### Windows (docker-build.bat)
```batch
docker-build.bat build              # Build the Docker image
docker-build.bat run                # Run the container
docker-build.bat build-and-run      # Build and run
docker-build.bat logs               # Show container logs
docker-build.bat stop               # Stop the container
docker-build.bat cleanup            # Clean up containers and images
docker-build.bat compose-up         # Start with Docker Compose
docker-build.bat compose-down       # Stop Docker Compose services
docker-build.bat compose-logs       # Show Docker Compose logs
```

### Linux/Mac (docker-build.sh)
```bash
./docker-build.sh build             # Build the Docker image
./docker-build.sh run               # Run the container
./docker-build.sh build-and-run     # Build and run
./docker-build.sh logs              # Show container logs
./docker-build.sh stop              # Stop the container
./docker-build.sh cleanup           # Clean up containers and images
./docker-build.sh compose-up        # Start with Docker Compose
./docker-build.sh compose-down      # Stop Docker Compose services
./docker-build.sh compose-logs      # Show Docker Compose logs
```

## Health Checks

The application includes health checks accessible at:
- http://localhost:8080/actuator/health

## Database

When using Docker Compose, a PostgreSQL database is automatically created with:
- **Database**: tms_db
- **Username**: tms_user
- **Password**: tms_password
- **Port**: 5432

## Volumes

Docker Compose creates a persistent volume for PostgreSQL data to ensure data persistence across container restarts.

## Network

All services run on a custom bridge network called `tms-network` for secure inter-service communication.

## Troubleshooting

1. **Port conflicts**: Ensure ports 8080 and 5432 are not in use
2. **Docker not running**: Start Docker Desktop
3. **Build failures**: Check Docker logs with `docker-build.bat logs` or `./docker-build.sh logs`
4. **Database connection issues**: Verify PostgreSQL container is running and healthy

## Production Considerations

For production deployment:
1. Use environment-specific configuration files
2. Set up proper secrets management
3. Configure logging appropriately
4. Set up monitoring and alerting
5. Use production-grade database with backups
6. Implement proper security measures