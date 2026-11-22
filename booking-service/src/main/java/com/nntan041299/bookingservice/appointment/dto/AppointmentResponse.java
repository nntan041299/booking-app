package com.nntan041299.bookingservice.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private Long customerId;
    private Long employeeId;
    private String employeeName;
    private Long serviceId;
    private String serviceName;
    private int durationMinutes;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private BigDecimal price;
    private boolean paid;
    /** {@code UPCOMING} until the appointment ends, then {@code COMPLETED}. */
    private String status;
    private String note;
}
