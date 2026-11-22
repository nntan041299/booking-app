package com.nntan041299.bookingservice.appointment.controller;

import com.nntan041299.bookingservice.appointment.dto.AppointmentResponse;
import com.nntan041299.bookingservice.appointment.dto.CreateAppointmentRequest;
import com.nntan041299.bookingservice.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/appointments")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /** The current customer's appointments, latest first. */
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> listMine() {
        return ResponseEntity.ok(appointmentService.listMine());
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
    }
}
