package com.powergrid.maintenance.tms_backend_application.transformer.repo;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransformerRepository extends JpaRepository<Transformer, String> {
  Optional<Transformer> findByTransformerNo(String transformerNo);
}
