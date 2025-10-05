package com.powergrid.maintenance.tms_backend_application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.client.RestTemplate;

@RestController
@SpringBootApplication
public class TmsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TmsBackendApplication.class, args);
    }

    @CrossOrigin
    @GetMapping("/home")
    public String home() {
        return "Spring Boot Application is running!";
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}