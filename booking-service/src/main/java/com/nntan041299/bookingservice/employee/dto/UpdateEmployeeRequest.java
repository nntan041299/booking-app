package com.nntan041299.bookingservice.employee.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Partial update: a {@code null} field is left unchanged.
 * {@code workingHours}, when present, replaces the employee's whole weekly schedule
 * (an empty list clears it).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {

    @Pattern(regexp = ".*\\S.*", message = "Full name must not be blank")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String bio;

    @Size(max = 255, message = "Avatar URL must not exceed 255 characters")
    private String avatarUrl;

    private Boolean active;

    @Valid
    private List<WorkingHoursRequest> workingHours;
}
