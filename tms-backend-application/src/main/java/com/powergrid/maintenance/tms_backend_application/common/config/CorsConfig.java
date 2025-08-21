package com.powergrid.maintenance.tms_backend_application.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:5173")
        .allowedMethods("GET","POST","PUT","DELETE","PATCH","OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("Location")
        .allowCredentials(false)
        .maxAge(3600);
  }
}
