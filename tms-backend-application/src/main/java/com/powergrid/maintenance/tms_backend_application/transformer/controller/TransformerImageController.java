package com.powergrid.maintenance.tms_backend_application.transformer.controller;

import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.service.TransformerImageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/transformers")
public class TransformerImageController {

    @Autowired
    private TransformerImageService transformerImageService;

    @PostMapping(value = "/{transformerNo}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @PathVariable String transformerNo,
            @RequestPart("image") MultipartFile file,
            @RequestPart("data") @Valid ImageUploadDTO imageUploadDTO) {
        try {
            ImageUploadResponseDTO response = transformerImageService.uploadBaseImage(
                transformerNo, imageUploadDTO, file);
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

    @GetMapping("/{transformerNo}/image/{weatherCondition}")
    public ResponseEntity<byte[]> getImage(
            @PathVariable String transformerNo,
            @PathVariable String weatherCondition) {
        try {
            byte[] imageData = transformerImageService.getImage(transformerNo, weatherCondition);
            if (imageData == null) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG); // You might want to store and use the actual content type
            headers.setContentLength(imageData.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(imageData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{transformerNo}/images/info")
    public ResponseEntity<?> getTransformerImagesInfo(@PathVariable String transformerNo) {
        try {
            TransformerImageInfoDTO imageInfo = transformerImageService.getTransformerImagesInfo(transformerNo);
            if (imageInfo == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Transformer not found with number: " + transformerNo);
            }
            return ResponseEntity.ok(imageInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving transformer images info: " + e.getMessage());
        }
    }

    @DeleteMapping("/{transformerNo}/image/{weatherCondition}")
    public ResponseEntity<?> deleteImage(
            @PathVariable String transformerNo,
            @PathVariable String weatherCondition) {
        try {
            boolean deleted = transformerImageService.deleteImage(transformerNo, weatherCondition);
            if (deleted) {
                return ResponseEntity.ok("Image deleted successfully for " + weatherCondition.toLowerCase() + " condition");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Image not found for transformer: " + transformerNo + " and condition: " + weatherCondition);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting image: " + e.getMessage());
        }
    }
}