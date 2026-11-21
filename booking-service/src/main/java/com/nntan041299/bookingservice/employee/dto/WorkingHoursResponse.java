package com.nntan041299.bookingservice.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class WorkingHoursResponse {

    private int dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
