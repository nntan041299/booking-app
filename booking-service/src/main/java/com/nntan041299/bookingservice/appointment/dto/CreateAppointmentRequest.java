package com.nntan041299.bookingservice.appointment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    @NotNull(message = "Employee is required")
    private Long employeeId;

    @NotNull(message = "Service is required")
    private Long serviceId;

    /** Local date-time, e.g. 2026-12-01T09:30:00. The end time is derived from the service duration. */
    @NotNull(message = "Start time is required")
    private LocalDateTime startAt;

    @Size(max = 1000, message = "Note must not exceed 1000 characters")
    private String note;
}
