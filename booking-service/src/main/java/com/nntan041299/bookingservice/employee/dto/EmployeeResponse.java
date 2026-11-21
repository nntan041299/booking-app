package com.nntan041299.bookingservice.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private boolean active;
    private List<WorkingHoursResponse> workingHours;
}
