package com.nntan041299.bookingservice.catalog.controller;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.dto.UpdateServiceRequest;
import com.nntan041299.bookingservice.catalog.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/services")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminServiceController {

    private final ServiceCatalogService serviceCatalogService;

    /** Multipart: the service fields as JSON in {@code data}, plus an optional {@code image} file. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceResponse> create(
            @Valid @RequestPart("data") CreateServiceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceCatalogService.create(request, image));
    }

    /**
     * Multipart: the fields as JSON in {@code data}, plus an optional {@code image} file. A new image replaces
     * the current one (or {@code data.removeImage} clears it); the previous image is deleted.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceResponse> update(
            @PathVariable Long id,
            @Valid @RequestPart("data") UpdateServiceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(serviceCatalogService.update(id, request, image));
    }

    /** Soft delete: deactivates the service so history stays intact. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        serviceCatalogService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
