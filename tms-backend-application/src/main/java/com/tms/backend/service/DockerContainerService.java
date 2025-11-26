package com.tms.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Service to manage on-demand Docker containers for ML services
 */
@Slf4j
@Service
public class DockerContainerService {

    @Value("${ml.finetune.container.name:tms-finetune-api}")
    private String finetuneContainerName;

    @Value("${ml.finetune.container.timeout:300}")
    private int containerTimeoutSeconds;

    /**
     * Start the finetune container on-demand
     */
    public boolean startFinetuneContainer() {
        try {
            log.info("Starting finetune container: {}", finetuneContainerName);
            
            // Check if container already exists
            if (isContainerRunning(finetuneContainerName)) {
                log.info("Finetune container already running");
                return true;
            }

            // Start the container using docker-compose with profile
            ProcessBuilder pb = new ProcessBuilder(
                "docker-compose",
                "-f", "docker-compose-ml-services.yml",
                "--profile", "finetune",
                "up", "-d", "finetune-api"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Wait for container to start
            boolean started = process.waitFor(containerTimeoutSeconds, TimeUnit.SECONDS);
            if (!started) {
                log.error("Finetune container failed to start within {} seconds", containerTimeoutSeconds);
                return false;
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Failed to start finetune container. Exit code: {}", exitCode);
                logProcessOutput(process);
                return false;
            }

            // Wait for container to be healthy
            return waitForContainerHealth(finetuneContainerName, 60);

        } catch (Exception e) {
            log.error("Error starting finetune container", e);
            return false;
        }
    }

    /**
     * Stop the finetune container to save resources
     */
    public boolean stopFinetuneContainer() {
        try {
            log.info("Stopping finetune container: {}", finetuneContainerName);

            if (!isContainerRunning(finetuneContainerName)) {
                log.info("Finetune container not running");
                return true;
            }

            // Stop and remove the container
            ProcessBuilder pb = new ProcessBuilder(
                "docker-compose",
                "-f", "docker-compose-ml-services.yml",
                "stop", "finetune-api"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(30, TimeUnit.SECONDS);

            // Remove the container
            ProcessBuilder pbRm = new ProcessBuilder(
                "docker-compose",
                "-f", "docker-compose-ml-services.yml",
                "rm", "-f", "finetune-api"
            );
            pbRm.redirectErrorStream(true);
            Process processRm = pbRm.start();
            processRm.waitFor(30, TimeUnit.SECONDS);

            log.info("Finetune container stopped successfully");
            return true;

        } catch (Exception e) {
            log.error("Error stopping finetune container", e);
            return false;
        }
    }

    /**
     * Check if a container is running
     */
    private boolean isContainerRunning(String containerName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "ps",
                "--filter", "name=" + containerName,
                "--format", "{{.Names}}"
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line = reader.readLine();
            process.waitFor(5, TimeUnit.SECONDS);
            return line != null && line.contains(containerName);
        } catch (Exception e) {
            log.error("Error checking container status", e);
            return false;
        }
    }

    /**
     * Wait for container to become healthy
     */
    private boolean waitForContainerHealth(String containerName, int timeoutSeconds) {
        log.info("Waiting for container {} to become healthy...", containerName);
        int attempts = 0;
        int maxAttempts = timeoutSeconds / 2;

        while (attempts < maxAttempts) {
            try {
                ProcessBuilder pb = new ProcessBuilder(
                    "docker", "inspect",
                    "--format", "{{.State.Health.Status}}",
                    containerName
                );
                Process process = pb.start();
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String health = reader.readLine();
                process.waitFor(5, TimeUnit.SECONDS);

                if ("healthy".equals(health)) {
                    log.info("Container {} is healthy", containerName);
                    return true;
                }

                Thread.sleep(2000);
                attempts++;
            } catch (Exception e) {
                log.warn("Error checking container health (attempt {})", attempts, e);
                attempts++;
            }
        }

        log.error("Container {} did not become healthy within {} seconds", containerName, timeoutSeconds);
        return false;
    }

    /**
     * Log process output for debugging
     */
    private void logProcessOutput(Process process) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        List<String> output = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null) {
            output.add(line);
        }
        log.error("Process output: {}", String.join("\n", output));
    }
}
