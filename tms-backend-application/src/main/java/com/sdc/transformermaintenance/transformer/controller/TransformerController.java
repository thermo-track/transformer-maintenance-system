package com.sdc.transformermaintenance.transformer.controller;


import com.sdc.transformermaintenance.transformer.dto.*;
import com.sdc.transformermaintenance.transformer.service.TransformerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transformers")
@RequiredArgsConstructor
public class TransformerController {

  private final TransformerService service;

  @PostMapping
  public TransformerResponse create(@RequestBody @Valid TransformerCreateRequest req) {
    return TransformerService.toResponse(service.create(req));
  }

  @GetMapping("/{id}")
  public TransformerResponse get(@PathVariable String id) {
    return TransformerService.toResponse(service.getEntity(id));
  }

  @GetMapping
  public Page<TransformerResponse> list(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
    return service.list(PageRequest.of(page, size, Sort.by("transformerNo").ascending()))
                  .map(TransformerService::toResponse);
  }

  @PutMapping("/{id}")
  public TransformerResponse update(@PathVariable String id,
                                    @RequestBody @Valid TransformerUpdateRequest req) {
    return TransformerService.toResponse(service.update(id, req));
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable String id) {
    service.delete(id);
  }
}