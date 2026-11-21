package com.nntan041299.bookingservice.employee.dto;

/** All fields are optional; a null field is not applied. */
public record EmployeeSearchCriteria(String keyword, Boolean active, Long serviceId) {
}
