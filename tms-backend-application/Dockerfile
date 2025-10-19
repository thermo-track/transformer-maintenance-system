# Use the official OpenJDK 21 image as base
FROM openjdk:21-jdk-slim as build

# Set the working directory
WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy the Maven configuration files
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:resolve

# Copy the source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:21-jdk-slim

# Install curl (required by HEALTHCHECK) and cleanup apt lists
RUN apt-get update && apt-get install -y curl \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r spring && useradd -r -g spring spring

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