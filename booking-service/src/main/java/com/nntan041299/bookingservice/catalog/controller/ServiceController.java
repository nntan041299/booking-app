package com.nntan041299.bookingservice.catalog.controller;

import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.dto.ServiceSearchCriteria;
import com.nntan041299.bookingservice.catalog.service.ServiceCatalogService;
import com.nntan041299.bookingservice.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    /**
     * Any authenticated user can search services. Every filter is optional and filters combine
     * with AND. Zero-based page; size is capped at 100.
     */
    @GetMapping
    public ResponseEntity<PageResponse<ServiceResponse>> search(
            ServiceSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(serviceCatalogService.search(criteria, page, size));
    }
}
