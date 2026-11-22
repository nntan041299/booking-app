package com.nntan041299.bookingservice.employee.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Partial update: a {@code null} field is left unchanged.
 * {@code workingHours}, when present, replaces the employee's whole weekly schedule
 * (an empty list clears it). {@code serviceIds}, when present, replaces the set of assigned services.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {

    @Pattern(regexp = ".*\\S.*", message = "Full name must not be blank")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String bio;

    /** {@code true} clears the current avatar. Ignored when a new avatar file is sent. */
    private Boolean removeAvatar;

    private Boolean active;

    @Valid
    private List<WorkingHoursRequest> workingHours;

    private Set<@NotNull(message = "Service id must not be null") Long> serviceIds;
}
