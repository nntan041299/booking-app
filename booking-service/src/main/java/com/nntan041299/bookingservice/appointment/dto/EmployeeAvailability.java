package com.nntan041299.bookingservice.appointment.dto;

import java.util.List;

/**
 * One employee's day. {@code busy} holds every appointment of the day (unpaid and paid, any customer; expired ones are left out),
 * without any customer details.
 */
public record EmployeeAvailability(
        Long id,
        String fullName,
        String avatarUrl,
        List<TimeRange> workingRanges,
        List<TimeRange> busy,
        int busyMinutes) {
}
