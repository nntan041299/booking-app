package com.nntan041299.bookingservice.appointment.service;

import com.nntan041299.bookingservice.appointment.dto.AppointmentResponse;
import com.nntan041299.bookingservice.appointment.dto.CreateAppointmentRequest;
import com.nntan041299.bookingservice.appointment.entity.Appointment;
import com.nntan041299.bookingservice.appointment.repository.AppointmentRepository;
import com.nntan041299.bookingservice.auth.service.CurrentUserProvider;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import com.nntan041299.bookingservice.catalog.repository.ServiceRepository;
import com.nntan041299.bookingservice.common.exception.ConflictException;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.employee.entity.Employee;
import com.nntan041299.bookingservice.employee.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ServiceRepository serviceRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public AppointmentResponse create(CreateAppointmentRequest request) {
        ServiceOffering service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.SERVICE_NOT_FOUND.name()));
        if (!service.isActive()) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NOT_AVAILABLE.name());
        }

        // Row lock on the employee serialises concurrent bookings, so the overlap check below cannot race.
        Employee employee = employeeRepository.findByIdForUpdate(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.EMPLOYEE_NOT_FOUND.name()));
        if (!employee.isActive() || !employee.getServiceIds().contains(service.getId())) {
            throw new IllegalArgumentException(ErrorCode.EMPLOYEE_NOT_AVAILABLE.name());
        }

        LocalDateTime start = request.getStartAt();
        LocalDateTime end = start.plusMinutes(service.getDurationMinutes());
        if (!start.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException(ErrorCode.APPOINTMENT_IN_PAST.name());
        }
        if (!withinWorkingHours(employee, start, end)) {
            throw new IllegalArgumentException(ErrorCode.OUTSIDE_WORKING_HOURS.name());
        }
        if (appointmentRepository.existsOverlapping(employee.getId(), start, end)) {
            throw new ConflictException(ErrorCode.TIME_SLOT_UNAVAILABLE);
        }

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .customerId(currentUserProvider.getCurrentUser().getId())
                .employeeId(employee.getId())
                .serviceId(service.getId())
                .startAt(start)
                .endAt(end)
                .price(service.getPrice())
                .note(request.getNote())
                .build());

        return new AppointmentResponse(appointment.getId(), appointment.getCustomerId(),
                employee.getId(), employee.getFullName(), service.getId(), service.getName(),
                appointment.getStartAt(), appointment.getEndAt(), appointment.getPrice(),
                appointment.isPaid(), appointment.getNote());
    }

    /** The whole appointment must fit inside one of the employee's working ranges on that day. */
    private boolean withinWorkingHours(Employee employee, LocalDateTime start, LocalDateTime end) {
        if (!start.toLocalDate().equals(end.toLocalDate())) {
            return false;
        }
        int dayOfWeek = start.getDayOfWeek().getValue();
        return employee.getWorkingHours().stream().anyMatch(range ->
                range.getDayOfWeek() == dayOfWeek
                        && !start.toLocalTime().isBefore(range.getStartTime())
                        && !end.toLocalTime().isAfter(range.getEndTime()));
    }
}
