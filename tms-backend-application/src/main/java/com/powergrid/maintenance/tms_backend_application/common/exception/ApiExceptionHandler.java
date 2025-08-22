package com.powergrid.maintenance.tms_backend_application.common.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<?> notFound(NotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
      .body(Map.of("timestamp", Instant.now(), "status", 404, "error", "Not Found", "message", ex.getMessage()));
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<?> conflict(ConflictException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
      .body(Map.of("timestamp", Instant.now(), "status", 409, "error", "Conflict", "message", ex.getMessage()));
  }
}