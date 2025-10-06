package com.powergrid.maintenance.tms_backend_application.transformer.controller;

import com.powergrid.maintenance.tms_backend_application.transformer.dto.*;
import com.powergrid.maintenance.tms_backend_application.transformer.service.TransformerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
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
    if (id.startsWith("TX-")) {
      return service.getByTransformerNo(id);
    } else {
      return TransformerService.toResponse(service.getEntity(id));
    }
  }

  @GetMapping("/meta")
  public Map<String, List<String>> meta() {
    return Map.of(
      "regions", List.of("KANDY", "COLOMBO", "JAFFNA", "TRINCOMALEE", "ANURADHAPURA", "BATTICALOA", "NEGOMBO", "GALLE"),
      "types", List.of("DISTRIBUTION", "BULK")
    );
  }


  @GetMapping("/numbers")
  public List<String> getTransformerNumbers(@RequestParam(required = false) String region) {
    return service.getAllTransformerNos();
  }

  @GetMapping
  public Page<TransformerResponse> list(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(required = false) String by,
                                        @RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to) {

    Pageable pageable = PageRequest.of(page, size, Sort.by("transformerNo").ascending());

    LocalDateTime fromDate = null;
    LocalDateTime toDate = null;

    if (from != null && !from.isEmpty()) {
      try {
        fromDate = LocalDateTime.parse(from, DateTimeFormatter.ISO_DATE_TIME);
      } catch (Exception ignored) {}
    }

    if (to != null && !to.isEmpty()) {
      try {
        toDate = LocalDateTime.parse(to, DateTimeFormatter.ISO_DATE_TIME);
      } catch (Exception ignored) {}
    }

    return service.list(pageable, q, by, fromDate, toDate)
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
