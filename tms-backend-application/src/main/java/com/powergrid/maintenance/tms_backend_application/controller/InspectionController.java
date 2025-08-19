package com.powergrid.maintenance.tms_backend_application.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.powergrid.maintenance.tms_backend_application.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.service.InspectionService;

@RestController
@RequestMapping("/inspections")
public class InspectionController {

    @Autowired
    InspectionService inspectionService;

    @PostMapping("addInspection")
    public ResponseEntity<String> addInspection(@RequestBody Inspection inspection) {
        return inspectionService.addInspection(inspection);
    }

    @PutMapping("updateInspection/{id}")
    public ResponseEntity<String> updateInspection(@PathVariable Long id, @RequestBody Inspection inspection) {
        return inspectionService.updateInspection(id, inspection);
    }

    @DeleteMapping("deleteInspection/{id}")
    public ResponseEntity<String> deleteInspection(@PathVariable Long id) {
        return inspectionService.deleteInspection(id);
    }
}
