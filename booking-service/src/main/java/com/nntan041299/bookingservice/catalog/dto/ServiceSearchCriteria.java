package com.nntan041299.bookingservice.catalog.dto;

import java.math.BigDecimal;

/** All fields are optional; a null field is not applied. */
public record ServiceSearchCriteria(
        String keyword,
        Boolean active,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer minDuration,
        Integer maxDuration
) {
}
