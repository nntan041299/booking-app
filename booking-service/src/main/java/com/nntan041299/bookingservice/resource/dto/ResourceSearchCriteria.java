package com.nntan041299.bookingservice.resource.dto;

import com.nntan041299.bookingservice.resource.entity.ResourceType;

/** All fields are optional; a null field is not applied. */
public record ResourceSearchCriteria(String keyword, ResourceType type, Boolean active, Long serviceId) {
}
