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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request));
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

    @PatchMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.update(id, request));
    }
}
