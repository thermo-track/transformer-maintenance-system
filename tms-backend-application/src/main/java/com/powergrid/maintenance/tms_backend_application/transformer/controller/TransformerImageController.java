package com.powergrid.maintenance.tms_backend_application.transformer.controller;

import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLastUpdatedDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.service.TransformerImageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "http://localhost:5173")
public class TransformerImageController {

    @Autowired
    private TransformerImageService transformerImageService;

    @PostMapping("/{transformerId}/image")
    public ResponseEntity<?> uploadImageUrl(
            @PathVariable String transformerId,
            @RequestBody @Valid ImageUploadDTO imageUploadDTO) {
        try {
            ImageUploadResponseDTO response = transformerImageService.saveImageFromUrl(
                transformerId, imageUploadDTO);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving image: " + e.getMessage());
        }
    }

    @GetMapping("/{transformerId}/image/{weatherCondition}")
    public ResponseEntity<?> getImageUrl(
            @PathVariable String transformerId,
            @PathVariable String weatherCondition) {
        try {
            String imageUrl = transformerImageService.getImageUrl(transformerId, weatherCondition);
            
            // Always return 200 OK with imageUrl (null if not found)
            // This prevents browser console from showing 404 errors
            return ResponseEntity.ok()
                    .body(new ImageUrlResponse(imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving image: " + e.getMessage()));
        }
    }

    @GetMapping("/{transformerId}/images/info")
    public ResponseEntity<?> getTransformerImagesInfo(@PathVariable String transformerId) {
        try {
            TransformerImageInfoDTO imageInfo = transformerImageService.getTransformerImagesInfo(transformerId);
            if (imageInfo == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Transformer not found with id: " + transformerId);
            }
            return ResponseEntity.ok(imageInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving transformer images info: " + e.getMessage());
        }
    }

    @DeleteMapping("/{transformerId}/image/{weatherCondition}")
    public ResponseEntity<?> deleteImage(
            @PathVariable String transformerId,
            @PathVariable String weatherCondition) {
        try {
            boolean deleted = transformerImageService.deleteImage(transformerId, weatherCondition);
            if (deleted) {
                return ResponseEntity.ok("Image deleted successfully for " + weatherCondition.toLowerCase() + " condition");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Image not found for transformer: " + transformerId + " and condition: " + weatherCondition);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting image: " + e.getMessage());
        }
    }

    @GetMapping("/{transformerId}/last-updated")
    public ResponseEntity<?> getTransformerLastUpdatedTime(@PathVariable String transformerId) {
        try {
            TransformerLastUpdatedDTO lastUpdatedInfo = transformerImageService.getTransformerLastUpdatedTime(transformerId);
            
            // Always return JSON, never plain text
            // If no images uploaded, the DTO will have null lastImageUpdatedAt 
            // but will include transformerUpdatedAt and transformerCreatedAt as fallbacks
            return ResponseEntity.ok(lastUpdatedInfo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving last updated time: " + e.getMessage()));
        }
    }
    
    // Helper class for image URL response
    public static class ImageUrlResponse {
        private String imageUrl;
        
        public ImageUrlResponse(String imageUrl) {
            this.imageUrl = imageUrl;
        }
        
        public String getImageUrl() {
            return imageUrl;
        }
        
        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }
    }
}