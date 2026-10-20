package com.nntan041299.bookingservice.catalog.controller;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
