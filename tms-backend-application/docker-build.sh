#!/bin/bash

# TMS Backend Docker Build Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="tms-backend"
TAG="latest"
CONTAINER_NAME="tms-backend-container"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running."
}

# Function to build the Docker image
build_image() {
    print_status "Building Docker image: $IMAGE_NAME:$TAG"
    
    if docker build -t "$IMAGE_NAME:$TAG" .; then
        print_status "Docker image built successfully!"
    else
        print_error "Failed to build Docker image."
        exit 1
    fi
}

# Function to run the container
run_container() {
    print_status "Starting container: $CONTAINER_NAME"
    
    # Stop and remove existing container if it exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        print_warning "Stopping and removing existing container: $CONTAINER_NAME"
        docker stop "$CONTAINER_NAME" > /dev/null 2>&1
        docker rm "$CONTAINER_NAME" > /dev/null 2>&1
    fi
    
    # Run the new container
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 8080:8080 \
        -e SPRING_PROFILES_ACTIVE=docker \
        -e DB_URL=jdbc:postgresql://host.docker.internal:5432/tms_db \
        -e DB_USERNAME=tms_user \
        -e DB_PASSWORD=tms_password \
        -e INFERENCE_API_URL=http://host.docker.internal:8001 \
        "$IMAGE_NAME:$TAG"
    
    if [ $? -eq 0 ]; then
        print_status "Container started successfully!"
        print_status "Application will be available at: http://localhost:8080"
        print_status "Swagger UI will be available at: http://localhost:8080/swagger-ui.html"
    else
        print_error "Failed to start container."
        exit 1
    fi
}

# Function to show container logs
show_logs() {
    print_status "Showing container logs..."
    docker logs -f "$CONTAINER_NAME"
}

# Function to stop the container
stop_container() {
    print_status "Stopping container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME"
    print_status "Container stopped."
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    docker stop "$CONTAINER_NAME" > /dev/null 2>&1
    docker rm "$CONTAINER_NAME" > /dev/null 2>&1
    docker rmi "$IMAGE_NAME:$TAG" > /dev/null 2>&1
    print_status "Cleanup completed."
}

# Main script logic
case "$1" in
    "build")
        check_docker
        build_image
        ;;
    "run")
        check_docker
        run_container
        ;;
    "build-and-run")
        check_docker
        build_image
        run_container
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_container
        ;;
    "cleanup")
        cleanup
        ;;
    "compose-up")
        check_docker
        print_status "Starting services with Docker Compose..."
        docker-compose up -d
        print_status "Services started. Application available at: http://localhost:8080"
        ;;
    "compose-down")
        print_status "Stopping Docker Compose services..."
        docker-compose down
        print_status "Services stopped."
        ;;
    "compose-logs")
        docker-compose logs -f tms-backend
        ;;
    *)
        echo "Usage: $0 {build|run|build-and-run|logs|stop|cleanup|compose-up|compose-down|compose-logs}"
        echo ""
        echo "Commands:"
        echo "  build          - Build the Docker image"
        echo "  run            - Run the container (requires external database)"
        echo "  build-and-run  - Build image and run container"
        echo "  logs           - Show container logs"
        echo "  stop           - Stop the container"
        echo "  cleanup        - Stop container and remove image"
        echo "  compose-up     - Start all services using Docker Compose (recommended)"
        echo "  compose-down   - Stop all Docker Compose services"
        echo "  compose-logs   - Show Docker Compose logs for backend service"
        exit 1
        ;;
esac