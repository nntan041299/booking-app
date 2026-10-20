package com.nntan041299.bookingservice.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private boolean active;
}
