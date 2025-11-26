# Use the official OpenJDK 21 image as base
FROM eclipse-temurin:21-jdk-alpine AS build

# Set the working directory
WORKDIR /app

# Copy the Maven wrapper files
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Make the Maven wrapper executable
RUN chmod +x mvnw

# Copy the Maven configuration files
COPY pom.xml .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN ./mvnw dependency:resolve

# Copy the source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install curl (required by HEALTHCHECK) and Docker CLI (for container management)
RUN apk add --no-cache curl docker-cli docker-cli-compose

# Create spring user and add to root group (needed for Docker socket access)
# Docker socket is typically owned by root group (GID 0)
RUN addgroup -S spring && \
    adduser -S spring -G spring && \
    adduser spring root

# Set the working directory
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership of the app directory to the spring user
RUN chown -R spring:spring /app

# Switch to the non-root user
USER spring

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]