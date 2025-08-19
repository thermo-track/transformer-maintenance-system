package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.common.exception.ConflictException;
import com.powergrid.maintenance.tms_backend_application.common.exception.NotFoundException;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.*;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

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
    t.setRegion(Transformer.Region.valueOf(r.region()));
    t.setType(Transformer.Type.valueOf(r.type()));
    t.setLocationDetails(r.locationDetails());
    return repo.save(t);
  }

  public Transformer getEntity(String id) {
    return repo.findById(id).orElseThrow(() -> new NotFoundException("Transformer not found"));
  }

  public Page<Transformer> list(Pageable pageable) {
    return repo.findAll(pageable);
  }

  public Transformer update(String id, TransformerUpdateRequest r) {
    Transformer t = getEntity(id);
    if (r.poleNo() != null) t.setPoleNo(r.poleNo());
    if (r.region() != null) t.setRegion(Transformer.Region.valueOf(r.region()));
    if (r.type() != null) t.setType(Transformer.Type.valueOf(r.type()));
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
      t.getRegion().name(),
      t.getType().name(),
      t.getLocationDetails()
    );
  }
}