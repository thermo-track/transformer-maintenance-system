package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.service.InspectionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/inspections/{inspectionId}/images")
@Tag(name = "Inspection Images", description = "Image management operations for inspections")
public class InspectionImageController {
    @Autowired
    private InspectionService inspectionService;

    @Operation(summary = "Save image metadata", description = "Save image metadata after Cloudinary upload")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image metadata saved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Inspection not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/image-metadata")
    public ResponseEntity<CloudImageUploadResponseDTO> saveImageMetadata(
            @Parameter(description = "Inspection ID", required = true)
            @PathVariable String inspectionId,
            @RequestBody @Valid CloudImageUploadDTO cloudImageUploadDTO) {
        try {
            log.info("Saving image metadata for inspection: {}", inspectionId);
            CloudImageUploadResponseDTO response = inspectionService.saveImageMetadata(inspectionId, cloudImageUploadDTO);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Inspection not found: {}", inspectionId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error saving image metadata for inspection: {}", inspectionId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Delete image metadata", description = "Delete image metadata for an inspection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image metadata deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Inspection or image not found"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/image-metadata")
    public ResponseEntity<Void> deleteImageMetadata(
            @Parameter(description = "Inspection ID", required = true)
            @PathVariable String inspectionId) {
        try {
            log.info("Deleting image metadata for inspection: {}", inspectionId);
            boolean deleted = inspectionService.deleteImageMetadata(inspectionId);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting image metadata for inspection: {}", inspectionId, e);
            return ResponseEntity.badRequest().build();
        }
    }


    @Operation(summary = "Check if inspection has cloud image", description = "Check if inspection has a cloud image stored")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cloud image status retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/has-cloud-image")
    public ResponseEntity<Map<String, Boolean>> hasCloudImage(
            @Parameter(description = "Inspection ID", required = true)
            @PathVariable String inspectionId) {
        try {
            log.info("Checking cloud image status for inspection: {}", inspectionId);
            boolean hasCloudImage = inspectionService.hasCloudImage(inspectionId);
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasCloudImage", hasCloudImage);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking cloud image status for inspection: {}", inspectionId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Get cloud image URL", description = "Get the cloud image URL for an inspection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cloud image URL retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Cloud image not found"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/cloud-image-url")
    public ResponseEntity<Map<String, String>> getCloudImageUrl(
            @Parameter(description = "Inspection ID", required = true)
            @PathVariable String inspectionId) {
        try {
            log.info("Retrieving cloud image URL for inspection: {}", inspectionId);
            String cloudImageUrl = inspectionService.getCloudImageUrl(inspectionId);
            if (cloudImageUrl != null) {
                Map<String, String> response = new HashMap<>();
                response.put("cloudImageUrl", cloudImageUrl);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving cloud image URL for inspection: {}", inspectionId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
