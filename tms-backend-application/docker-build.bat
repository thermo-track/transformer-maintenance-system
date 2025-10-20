@echo off
REM TMS Backend Docker Build Script for Windows

REM Configuration
set IMAGE_NAME=tms-backend
set TAG=latest
set CONTAINER_NAME=tms-backend-container

REM Function to check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)

if "%1"=="build" (
    echo [INFO] Building Docker image: %IMAGE_NAME%:%TAG%
    docker build -t %IMAGE_NAME%:%TAG% .
    if %errorlevel% equ 0 (
        echo [INFO] Docker image built successfully!
    ) else (
        echo [ERROR] Failed to build Docker image.
        exit /b 1
    )
) else if "%1"=="run" (
    echo [INFO] Starting container: %CONTAINER_NAME%
    
    REM Stop and remove existing container if it exists
    docker ps -a --format "table {{.Names}}" | findstr /c:"%CONTAINER_NAME%" >nul
    if %errorlevel% equ 0 (
        echo [WARNING] Stopping and removing existing container: %CONTAINER_NAME%
        docker stop %CONTAINER_NAME% >nul 2>&1
        docker rm %CONTAINER_NAME% >nul 2>&1
    )
    
    REM Run the new container
    docker run -d ^
        --name %CONTAINER_NAME% ^
        -p 8080:8080 ^
        -e SPRING_PROFILES_ACTIVE=docker ^
        -e DB_URL=jdbc:postgresql://host.docker.internal:5432/tms_db ^
        -e DB_USERNAME=tms_user ^
        -e DB_PASSWORD=tms_password ^
        -e INFERENCE_API_URL=http://host.docker.internal:8001 ^
        %IMAGE_NAME%:%TAG%
    
    if %errorlevel% equ 0 (
        echo [INFO] Container started successfully!
        echo [INFO] Application will be available at: http://localhost:8080
        echo [INFO] Swagger UI will be available at: http://localhost:8080/swagger-ui.html
    ) else (
        echo [ERROR] Failed to start container.
        exit /b 1
    )
) else if "%1"=="build-and-run" (
    call %0 build
    if %errorlevel% equ 0 call %0 run
) else if "%1"=="logs" (
    echo [INFO] Showing container logs...
    docker logs -f %CONTAINER_NAME%
) else if "%1"=="stop" (
    echo [INFO] Stopping container: %CONTAINER_NAME%
    docker stop %CONTAINER_NAME%
    echo [INFO] Container stopped.
) else if "%1"=="cleanup" (
    echo [INFO] Cleaning up...
    docker stop %CONTAINER_NAME% >nul 2>&1
    docker rm %CONTAINER_NAME% >nul 2>&1
    docker rmi %IMAGE_NAME%:%TAG% >nul 2>&1
    echo [INFO] Cleanup completed.
) else if "%1"=="compose-up" (
    echo [INFO] Starting services with Docker Compose...
    docker-compose up -d
    echo [INFO] Services started. Application available at: http://localhost:8080
) else if "%1"=="compose-down" (
    echo [INFO] Stopping Docker Compose services...
    docker-compose down
    echo [INFO] Services stopped.
) else if "%1"=="compose-logs" (
    docker-compose logs -f tms-backend
) else (
    echo Usage: %0 {build^|run^|build-and-run^|logs^|stop^|cleanup^|compose-up^|compose-down^|compose-logs}
    echo.
    echo Commands:
    echo   build          - Build the Docker image
    echo   run            - Run the container ^(requires external database^)
    echo   build-and-run  - Build image and run container
    echo   logs           - Show container logs
    echo   stop           - Stop the container
    echo   cleanup        - Stop container and remove image
    echo   compose-up     - Start all services using Docker Compose ^(recommended^)
    echo   compose-down   - Stop all Docker Compose services
    echo   compose-logs   - Show Docker Compose logs for backend service
    exit /b 1
)