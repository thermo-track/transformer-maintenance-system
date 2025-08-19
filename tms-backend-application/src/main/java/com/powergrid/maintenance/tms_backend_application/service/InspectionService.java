package com.powergrid.maintenance.tms_backend_application.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.powergrid.maintenance.tms_backend_application.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.repo.InspectionRepo;

@Service
public class InspectionService {

    @Autowired
    InspectionRepo inspectionRepo;

    public ResponseEntity<String> addInspection(Inspection inspection) {
        try{
            inspectionRepo.save(inspection);
            return new ResponseEntity<>("success", HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("failure", HttpStatus.BAD_GATEWAY);
        }
    }

    public ResponseEntity<String> updateInspection(Long id, Inspection inspection) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateInspection'");
    }

    public ResponseEntity<String> deleteInspection(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteInspection'");
    }

}
