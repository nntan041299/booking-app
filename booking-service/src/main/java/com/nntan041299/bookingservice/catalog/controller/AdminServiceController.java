package com.nntan041299.bookingservice.catalog.controller;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.dto.UpdateServiceRequest;
import com.nntan041299.bookingservice.catalog.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/services")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminServiceController {

    private final ServiceCatalogService serviceCatalogService;

    @PostMapping
    public ResponseEntity<ServiceResponse> create(@Valid @RequestBody CreateServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceCatalogService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateServiceRequest request) {
        return ResponseEntity.ok(serviceCatalogService.update(id, request));
    }

    /** Soft delete: deactivates the service so history stays intact. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        serviceCatalogService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
