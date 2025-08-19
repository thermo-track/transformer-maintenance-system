package com.sdc.transformermaintenance.transformer.repo;

import com.sdc.transformermaintenance.transformer.domain.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransformerRepository extends JpaRepository<Transformer, String> {
  Optional<Transformer> findByTransformerNo(String transformerNo);
}
