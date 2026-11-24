package com.nntan041299.bookingservice.appointment.dto;

import java.time.LocalDateTime;

/** A local date-time range, e.g. a working shift or a booked slot. */
public record TimeRange(LocalDateTime start, LocalDateTime end) {
}
