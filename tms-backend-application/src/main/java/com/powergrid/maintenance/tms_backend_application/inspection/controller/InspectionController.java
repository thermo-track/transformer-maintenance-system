package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RestController;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.service.InspectionService;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadResponseDTO;

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


/**
 * Save image metadata after Cloudinary upload
 */
@PostMapping("/{inspectionId}/image-metadata")
public ResponseEntity<CloudImageUploadResponseDTO> saveImageMetadata(
        @PathVariable String inspectionId,
        @RequestBody @Valid CloudImageUploadDTO cloudImageUploadDTO) {
    try {
        CloudImageUploadResponseDTO response = inspectionService.saveImageMetadata(inspectionId, cloudImageUploadDTO);
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        // Return 404 if inspection not found
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        // Return 400 for other validation errors
        return ResponseEntity.badRequest().build();
    }
}
/**
 * Delete image metadata
 */
@DeleteMapping("/{inspectionId}/image-metadata")
public ResponseEntity<Void> deleteImageMetadata(@PathVariable String inspectionId) {
    try {
        boolean deleted = inspectionService.deleteImageMetadata(inspectionId);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}


/**
 * Check if inspection has cloud image specifically
 */
@GetMapping("/{inspectionId}/has-cloud-image")
public ResponseEntity<Map<String, Boolean>> hasCloudImage(@PathVariable String inspectionId) {
    try {
        boolean hasCloudImage = inspectionService.hasCloudImage(inspectionId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasCloudImage", hasCloudImage);
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}

/**
 * Get cloud image URL
 */
@GetMapping("/{inspectionId}/cloud-image-url")
public ResponseEntity<Map<String, String>> getCloudImageUrl(@PathVariable String inspectionId) {
    try {
        String cloudImageUrl = inspectionService.getCloudImageUrl(inspectionId);
        if (cloudImageUrl != null) {
            Map<String, String> response = new HashMap<>();
            response.put("cloudImageUrl", cloudImageUrl);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}
    

}