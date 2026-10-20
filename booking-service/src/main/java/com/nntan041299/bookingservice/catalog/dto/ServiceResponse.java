package com.nntan041299.bookingservice.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ServiceResponse {

    private Long id;
    private String name;
    private String description;
    private int durationMinutes;
    private BigDecimal price;
    private boolean active;
}
