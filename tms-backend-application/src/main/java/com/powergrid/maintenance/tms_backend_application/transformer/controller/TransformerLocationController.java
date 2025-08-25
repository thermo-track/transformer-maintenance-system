package com.powergrid.maintenance.tms_backend_application.transformer.controller;

import com.powergrid.maintenance.tms_backend_application.transformer.dto.UpdateLocationRequestDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLocationResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerMapLocationDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.service.TransformerLocationService;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transformers")
public class TransformerLocationController {

    @Autowired
    private TransformerLocationService transformerLocationService;

    @PutMapping("/{transformerNo}/location")
    public ResponseEntity<?> updateTransformerLocation(
            @PathVariable String transformerNo,
            @RequestBody @Valid UpdateLocationRequestDTO request) {
        try {
            TransformerLocationResponseDTO response = transformerLocationService.updateTransformerLocation(transformerNo, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating transformer location: " + e.getMessage());
        }
    }

    @GetMapping("/{transformerNo}/location")
    public ResponseEntity<?> getTransformerLocation(@PathVariable String transformerNo) {
        try {
            TransformerLocationResponseDTO response = transformerLocationService.getTransformerLocation(transformerNo);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving transformer location: " + e.getMessage());
        }
    }

    @GetMapping("/{transformerNo}/location/exists")
    public ResponseEntity<?> checkLocationExists(@PathVariable String transformerNo) {
        try {
            boolean hasLocation = transformerLocationService.hasLocation(transformerNo);
            return ResponseEntity.ok().body("Transformer has location: " + hasLocation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error checking location existence: " + e.getMessage());
        }
    }

    @DeleteMapping("/{transformerNo}/location")
    public ResponseEntity<?> deleteTransformerLocation(@PathVariable String transformerNo) {
        try {
            boolean deleted = transformerLocationService.deleteTransformerLocation(transformerNo);
            if (deleted) {
                return ResponseEntity.ok("Location deleted successfully for transformer: " + transformerNo);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Location not found for transformer: " + transformerNo);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting location: " + e.getMessage());
        }
    }
    @GetMapping("/locations/map")
    public ResponseEntity<?> getAllTransformersForMap() {
        try {
            List<TransformerMapLocationDTO> transformersWithLocation = 
                    transformerLocationService.getAllTransformersWithLocation();
            
            if (transformersWithLocation.isEmpty()) {
                return ResponseEntity.ok()
                        .body("No transformers found with location data");
            }
            
            return ResponseEntity.ok(transformersWithLocation);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving transformers for map: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error retrieving transformers for map: " + e.getMessage());
        }
    }
}