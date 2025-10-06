package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.common.exception.ConflictException;
import com.powergrid.maintenance.tms_backend_application.common.exception.NotFoundException;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.*;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TransformerService {

  private final TransformerRepository repo;
  private final InspectionRepo inspectionRepo;

  public Transformer create(TransformerCreateRequest r) {
    repo.findByTransformerNo(r.transformerNo()).ifPresent(x -> {
      throw new ConflictException("Transformer number already exists");
    });
    Transformer t = new Transformer();
    t.setTransformerNo(r.transformerNo());
    t.setPoleNo(r.poleNo());
    t.setRegion(r.region());
    t.setType(r.type());
    t.setLocationDetails(r.locationDetails());
    return repo.save(t);
  }

  public Transformer getEntity(String id) {
    return repo.findById(id).orElseThrow(() -> new NotFoundException("Transformer not found"));
  }

  public Transformer getEntityByTransformerNo(String transformerNo) {
    return repo.findByTransformerNo(transformerNo).orElseThrow(() -> new NotFoundException("Transformer not found"));
  }

  public TransformerResponse getByTransformerNo(String transformerNo) {
    Optional<Object[]> result = repo.findTransformerDataByTransformerNo(transformerNo);
    if (result.isEmpty()) {
      throw new NotFoundException("Transformer not found");
    }
    
    Object[] data = result.get();
    return new TransformerResponse(
      (String) data[0], // id
      (String) data[1], // transformerNo
      (String) data[2], // poleNo
      (String) data[3], // region
      (String) data[4], // type
      (String) data[5]  // locationDetails
    );
  }

  // Keep existing method for backward compatibility
  public Page<Transformer> list(Pageable pageable) {
    return repo.findAll(pageable);
  }

  // New method with search support
  public Page<Transformer> list(Pageable pageable, String query, String searchBy, LocalDateTime fromDate, LocalDateTime toDate) {

    if ((query == null || query.trim().isEmpty()) && fromDate == null && toDate == null) {
      return list(pageable);
    }

    Specification<Transformer> spec = (root, criteriaQuery, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (query != null && !query.trim().isEmpty() && searchBy != null) {
        String searchQuery = "%" + query.trim().toLowerCase() + "%";

        switch (searchBy) {
          case "transformerNo":
            predicates.add(criteriaBuilder.like(
              criteriaBuilder.lower(root.get("transformerNo")), searchQuery));
            break;
          case "poleNo":
            Predicate poleNoNotNull = criteriaBuilder.isNotNull(root.get("poleNo"));
            Predicate poleNoMatch = criteriaBuilder.like(
              criteriaBuilder.lower(root.get("poleNo")), searchQuery);
            predicates.add(criteriaBuilder.and(poleNoNotNull, poleNoMatch));
            break;
          default:
            Predicate transformerNoMatch = criteriaBuilder.like(
              criteriaBuilder.lower(root.get("transformerNo")), searchQuery);

            Predicate poleNoNotNull2 = criteriaBuilder.isNotNull(root.get("poleNo"));
            Predicate poleNoMatch2 = criteriaBuilder.like(
              criteriaBuilder.lower(root.get("poleNo")), searchQuery);
            Predicate poleNoCondition = criteriaBuilder.and(poleNoNotNull2, poleNoMatch2);

            predicates.add(criteriaBuilder.or(transformerNoMatch, poleNoCondition));
        }
      }

      // Date filters commented out intentionally (no date fields exposed yet)
      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };

    return repo.findAll(spec, pageable);
  }

  public Transformer update(String id, TransformerUpdateRequest r) {
    Transformer t = getEntity(id);
    if (r.poleNo() != null) t.setPoleNo(r.poleNo());
    if (r.region() != null) t.setRegion(r.region());
    if (r.type() != null) t.setType(r.type());
    if (r.locationDetails() != null) t.setLocationDetails(r.locationDetails());
    return repo.save(t);
  }

  public void delete(String id) {
    Transformer transformer = getEntity(id);
    int inspectionCount = inspectionRepo.findByTransformerNo(transformer.getTransformerNo()).size();
    
    System.out.println("WARNING: Deleting transformer " + transformer.getTransformerNo() + 
                      " will cascade delete " + inspectionCount + 
                      " inspection(s) and all associated notes, anomalies, and metadata.");
    
    repo.delete(transformer);
  }

  public static TransformerResponse toResponse(Transformer t) {
    // This method should only be used with fully loaded entities (not proxies)
    // For better performance, use getByTransformerNo which avoids entity loading
    return new TransformerResponse(
      t.getId(),
      t.getTransformerNo(),
      t.getPoleNo(),
      t.getRegion(),
      t.getType(),
      t.getLocationDetails()
    );
  }
  public List<String> getAllTransformerNos() {
    return repo.findAllTransformerNos();
  }

  public List<String> getTransformerNosByRegion(String region) {
    return repo.findTransformerNosByRegion(region);
  }

  
}
