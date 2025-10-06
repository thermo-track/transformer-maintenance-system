package com.powergrid.maintenance.tms_backend_application.inspection.service;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InferenceMetadataRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionAnomalyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class InferenceService {

    private final InferenceMetadataRepository metadataRepository;
    private final InspectionAnomalyRepository anomalyRepository;

    public List<InspectionAnomaly> getAnomaliesForInspection(Long inspectionId) {
        return anomalyRepository.findByInspectionId(inspectionId);
    }

    public InferenceMetadata getMetadataForInspection(Long inspectionId) {
        return metadataRepository.findByInspectionId(inspectionId).orElse(null);
    }

    public InspectionAnomaly updateAnomalyNotes(String anomalyId, String notes) {
        InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found"));
        anomaly.setNotes(notes);
        return anomalyRepository.save(anomaly);
    }
}