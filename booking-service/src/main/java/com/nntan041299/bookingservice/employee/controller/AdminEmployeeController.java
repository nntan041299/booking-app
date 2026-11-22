package com.nntan041299.bookingservice.employee.controller;

import com.nntan041299.bookingservice.employee.dto.CreateEmployeeRequest;
import com.nntan041299.bookingservice.common.dto.PageResponse;
import com.nntan041299.bookingservice.employee.dto.EmployeeResponse;
import com.nntan041299.bookingservice.employee.dto.EmployeeSearchCriteria;
import com.nntan041299.bookingservice.employee.dto.UpdateEmployeeRequest;
import com.nntan041299.bookingservice.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEmployeeController {

    private final EmployeeService employeeService;

    /** Multipart: the employee fields as JSON in {@code data}, plus an optional {@code avatar} image file. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EmployeeResponse> create(
            @Valid @RequestPart("data") CreateEmployeeRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request, avatar));
    }

    /** Every filter is optional. Zero-based page; size is capped at 100. */
    @GetMapping
    public ResponseEntity<PageResponse<EmployeeResponse>> search(
            EmployeeSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(employeeService.search(criteria, page, size));
    }

    /** Soft delete: deactivates the employee and their login so appointment history stays intact. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        employeeService.remove(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Multipart: the changed fields as JSON in {@code data}, plus an optional {@code avatar} image file.
     * A new avatar replaces the current one (or {@code data.removeAvatar} clears it); the previous image is deleted.
     */
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EmployeeResponse> update(
            @PathVariable Long id,
            @Valid @RequestPart("data") UpdateEmployeeRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
        return ResponseEntity.ok(employeeService.update(id, request, avatar));
    }
}
