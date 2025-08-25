package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.service.InspectionService;

import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Parameter;


@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/inspections")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @Operation(summary = "Create a new inspection", description = "Creates a new power grid inspection record")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Inspection created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Inspection already exists for the same transformer and date"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<InspectionResponseDTO> createInspection(
            @Valid @RequestBody InspectionCreateRequestDTO requestDTO) {
        log.info("Creating new inspection for transformer: {}", requestDTO.getTransformerNo());
        return inspectionService.createInspection(requestDTO);
    }

    @Operation(summary = "Update an existing inspection", description = "Updates an existing inspection by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspection updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Inspection not found"),
            @ApiResponse(responseCode = "409", description = "Inspection already exists for the same transformer and date"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<InspectionResponseDTO> updateInspection(
            @Parameter(description = "Inspection ID (9-digit format)", example = "000000001")
            @PathVariable String id,
            @Valid @RequestBody InspectionUpdateRequestDTO requestDTO) {
        log.info("Updating inspection with ID: {}", id);
        return inspectionService.updateInspection(id, requestDTO);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<InspectionStatusResponseDTO> updateInspectionStatus(
            @Parameter(description = "Inspection ID (9-digit format)", example = "000000001")
            @PathVariable String id,
            @Valid @RequestBody InspectionStatusUpdateRequestDTO requestDTO) {
        log.info("Updating inspection status with ID: {}", id);
        return inspectionService.updateInspectionStatus(id, requestDTO);
    }

    @Operation(summary = "Delete an inspection", description = "Deletes an inspection by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Inspection deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Inspection not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(
            @Parameter(description = "Inspection ID (9-digit format)", example = "000000001")
            @PathVariable String id) {
        log.info("Deleting inspection with ID: {}", id);
        return inspectionService.deleteInspection(id);
    }

    @Operation(summary = "Get inspection by ID", description = "Retrieves a specific inspection by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspection retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Inspection not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{id}")
    public ResponseEntity<InspectionResponseDTO> getInspectionById(
            @Parameter(description = "Inspection ID (9-digit format)", example = "000000001")
            @PathVariable String id) {
        log.info("Retrieving inspection with ID: {}", id);
        return inspectionService.getInspectionById(id);
    }

    @Operation(summary = "Get all inspections", description = "Retrieves all inspection records")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspections retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<List<InspectionResponseDTO>> getAllInspections() {
        log.info("Retrieving all inspections");
        return inspectionService.getAllInspections();
    }

    @Operation(summary = "Get inspections by branch", description = "Retrieves all inspections for a specific branch")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspections retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/branch/{branch}")
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByBranch(
            @Parameter(description = "Branch name", example = "North Branch")
            @PathVariable String branch) {
        log.info("Retrieving inspections for branch: {}", branch);
        return inspectionService.getInspectionsByBranch(branch);
    }

    @Operation(summary = "Get inspections by date range", description = "Retrieves inspections within a specified date range")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspections retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date format"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/date-range")
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByDateRange(
            @Parameter(description = "Start date (yyyy-MM-dd)", example = "2024-01-01")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)", example = "2024-12-31")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Retrieving inspections for date range: {} to {}", startDate, endDate);
        return inspectionService.getInspectionsByDateRange(startDate, endDate);
    }
    // Add this method to your existing InspectionController.java

    @Operation(summary = "Get inspections by transformer ID", description = "Retrieves all inspection records for a specific transformer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inspections retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No inspections found for the transformer"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/transformer/{transformerId}")
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByTransformerId(
            @Parameter(description = "Transformer ID to filter inspections", required = true)
            @PathVariable String transformerId) {
        log.info("Retrieving inspections for transformer ID: {}", transformerId);
        return inspectionService.getInspectionsByTransformerId(transformerId);
    }

    // Image related endpoints
    @PostMapping(value = "/{inspectionId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @PathVariable String inspectionId,
            @RequestPart("image") MultipartFile file,
            @RequestPart("data") @Valid ImageUploadDTO imageUploadDTO) {
        try {
            ImageUploadResponseDTO response = inspectionService.uploadImage(inspectionId, file, imageUploadDTO);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading image: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/{inspectionId}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable String inspectionId) {
        byte[] imageData = inspectionService.getImage(inspectionId);
        String imageType = inspectionService.getImageType(inspectionId);
        
        if (imageData != null && imageType != null) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(imageType));
            headers.setContentLength(imageData.length);
            
            return new ResponseEntity<>(imageData, headers, HttpStatus.OK);
        }
        
        return ResponseEntity.notFound().build();
    }
    @DeleteMapping("/{inspectionId}/image")
    public ResponseEntity<Void> deleteImage(@PathVariable String inspectionId) {
        if (inspectionService.deleteImage(inspectionId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    @GetMapping("/{inspectionId}/has-image")
    public ResponseEntity<Boolean> checkIfInspectionHasImage(@PathVariable String inspectionId) {
        byte[] imageData = inspectionService.getImage(inspectionId);
        boolean hasImage = imageData != null && imageData.length > 0;
        return ResponseEntity.ok(hasImage);
    }
    @GetMapping("/{inspectionId}/weather-condition")
    public ResponseEntity<Map<String, String>> getInspectionWeatherCondition(@PathVariable String inspectionId) {
        try {
            String weatherCondition = inspectionService.getWeatherCondition(inspectionId);
            if (weatherCondition != null) {
                Map<String, String> response = new HashMap<>();
                response.put("weatherCondition", weatherCondition);
                response.put("inspectionId", inspectionId);
                
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching weather condition for inspection: " + inspectionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Get latest inspection for each transformer", 
           description = "Retrieves the most recent inspection record for each transformer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Latest inspections retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/latest-per-transformer")
    public ResponseEntity<List<InspectionResponseDTO>> getLatestInspectionPerTransformer() {
        log.info("Retrieving latest inspection for each transformer");
        return inspectionService.getLatestInspectionPerTransformer();
    }

    

}