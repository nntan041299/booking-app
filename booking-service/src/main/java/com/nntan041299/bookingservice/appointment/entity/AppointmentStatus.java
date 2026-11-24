package com.nntan041299.bookingservice.appointment.entity;

public enum AppointmentStatus {
    /** The customer picked a slot and has not paid yet. The slot counts as booked for everyone. */
    WAITING_PAYMENT,
    /** The customer paid; the booking is final. */
    PAID,
    /** The customer did not pay in time. The slot is free again. */
    EXPIRED
}
