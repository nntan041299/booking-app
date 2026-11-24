package com.nntan041299.bookingservice.appointment.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PayAppointmentRequest {

    /** Optional note for the therapist; replaces the note given when the slot was held. */
    @Size(max = 1000, message = "Note must not exceed 1000 characters")
    private String note;
}
