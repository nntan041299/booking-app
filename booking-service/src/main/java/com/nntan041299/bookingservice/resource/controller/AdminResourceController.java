package com.nntan041299.bookingservice.resource.controller;

import com.nntan041299.bookingservice.common.dto.PageResponse;
import com.nntan041299.bookingservice.resource.dto.CreateResourceRequest;
import com.nntan041299.bookingservice.resource.dto.ResourceResponse;
import com.nntan041299.bookingservice.resource.dto.ResourceSearchCriteria;
import com.nntan041299.bookingservice.resource.dto.UpdateResourceRequest;
import com.nntan041299.bookingservice.resource.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/resources")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminResourceController {

    private final ResourceService resourceService;

    /** Multipart: the resource fields as JSON in {@code data}, plus an optional {@code image} file. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> create(
            @Valid @RequestPart("data") CreateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.create(request, image));
    }

    /** Every filter is optional. Zero-based page; size is capped at 100. */
    @GetMapping
    public ResponseEntity<PageResponse<ResourceResponse>> search(
            ResourceSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(resourceService.search(criteria, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.get(id));
    }

    /**
     * Multipart: the fields as JSON in {@code data}, plus an optional {@code image} file. A new image replaces
     * the current one (or {@code data.removeImage} clears it); the previous image is deleted.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> update(
            @PathVariable Long id,
            @Valid @RequestPart("data") UpdateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(resourceService.update(id, request, image));
    }

    /** Soft delete: deactivates the resource so history stays intact. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        resourceService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
