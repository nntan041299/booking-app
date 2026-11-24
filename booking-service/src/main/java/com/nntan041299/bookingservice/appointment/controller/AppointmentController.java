package com.nntan041299.bookingservice.appointment.controller;

import com.nntan041299.bookingservice.appointment.dto.AppointmentResponse;
import com.nntan041299.bookingservice.appointment.dto.AvailabilityResponse;
import com.nntan041299.bookingservice.appointment.dto.PayAppointmentRequest;
import com.nntan041299.bookingservice.appointment.dto.CreateAppointmentRequest;
import com.nntan041299.bookingservice.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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

    /** Each employee who offers the service, with their working ranges and booked slots on the day. */
    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> availability(
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.availability(serviceId, date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.get(id));
    }

    /** Books the slot as WAITING_PAYMENT; it counts as booked for every customer until paid, released or expired. */
    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
    }

    /** Marks a WAITING_PAYMENT booking as PAID. The body is optional. */
    @PostMapping("/{id}/pay")
    public ResponseEntity<AppointmentResponse> pay(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) PayAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.pay(id, request));
    }

    /** Releases a WAITING_PAYMENT booking. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> release(@PathVariable Long id) {
        appointmentService.release(id);
        return ResponseEntity.noContent().build();
    }
}
