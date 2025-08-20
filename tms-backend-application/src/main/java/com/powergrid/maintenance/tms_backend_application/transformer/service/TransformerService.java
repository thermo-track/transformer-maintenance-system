package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.common.exception.ConflictException;
import com.powergrid.maintenance.tms_backend_application.common.exception.NotFoundException;
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

@Service
@RequiredArgsConstructor
public class TransformerService {

  private final TransformerRepository repo;

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

  // Keep existing method for backward compatibility
  public Page<Transformer> list(Pageable pageable) {
    return repo.findAll(pageable);
  }

  // New method with search support
  public Page<Transformer> list(Pageable pageable, String query, String searchBy, LocalDateTime fromDate, LocalDateTime toDate) {
    
    // If no search parameters, use the existing method
    if ((query == null || query.trim().isEmpty()) && fromDate == null && toDate == null) {
        return list(pageable);
    }
    
    // Build dynamic query using Specification
    Specification<Transformer> spec = (root, criteriaQuery, criteriaBuilder) -> {
        List<Predicate> predicates = new ArrayList<>();
        
        // Search by field
        if (query != null && !query.trim().isEmpty() && searchBy != null) {
            String searchQuery = "%" + query.trim().toLowerCase() + "%";
            
            switch (searchBy) {
                case "transformerNo":
                    predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("transformerNo")), searchQuery));
                    break;
                case "poleNo":
                    // Handle null pole numbers gracefully
                    Predicate poleNoNotNull = criteriaBuilder.isNotNull(root.get("poleNo"));
                    Predicate poleNoMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("poleNo")), searchQuery);
                    predicates.add(criteriaBuilder.and(poleNoNotNull, poleNoMatch));
                    break;
                default:
                    // Search both fields if searchBy is invalid or not specified
                    Predicate transformerNoMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("transformerNo")), searchQuery);
                    
                    Predicate poleNoNotNull2 = criteriaBuilder.isNotNull(root.get("poleNo"));
                    Predicate poleNoMatch2 = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("poleNo")), searchQuery);
                    Predicate poleNoCondition = criteriaBuilder.and(poleNoNotNull2, poleNoMatch2);
                    
                    predicates.add(criteriaBuilder.or(transformerNoMatch, poleNoCondition));
            }
        }
        
        // Date range filter - only add if there are date fields in Transformer entity
        /*
        if (fromDate != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdDate"), fromDate));
        }
        
        if (toDate != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdDate"), toDate));
        }
        */
        
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
    repo.delete(getEntity(id));
  }

  public static TransformerResponse toResponse(Transformer t) {
    return new TransformerResponse(
      t.getId(),
      t.getTransformerNo(),
      t.getPoleNo(),
      t.getRegion(),
      t.getType(),
      t.getLocationDetails()
    );
  }
}