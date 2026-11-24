package com.nntan041299.bookingservice.appointment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** The service being booked and the day of every active employee who offers it. */
public record AvailabilityResponse(
        Long serviceId,
        String serviceName,
        int durationMinutes,
        BigDecimal price,
        String imageUrl,
        LocalDate date,
        List<EmployeeAvailability> employees) {
}
