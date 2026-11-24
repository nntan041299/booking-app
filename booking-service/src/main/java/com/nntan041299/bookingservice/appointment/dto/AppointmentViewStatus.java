package com.nntan041299.bookingservice.appointment.dto;

/** The status a customer sees. Derived from the stored status and the appointment time, never persisted. */
public enum AppointmentViewStatus {
    /** Not paid yet; the slot is held. */
    WAITING_PAYMENT,
    /** Not paid in time; the hold ran out. */
    EXPIRED,
    /** Paid and not finished yet. */
    UPCOMING,
    /** Paid and already ended. */
    COMPLETED
}
