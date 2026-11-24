package com.nntan041299.bookingservice.appointment.service;

import com.nntan041299.bookingservice.appointment.dto.AppointmentResponse;
import com.nntan041299.bookingservice.appointment.dto.AppointmentViewStatus;
import com.nntan041299.bookingservice.appointment.dto.AvailabilityResponse;
import com.nntan041299.bookingservice.appointment.dto.PayAppointmentRequest;
import com.nntan041299.bookingservice.appointment.dto.EmployeeAvailability;
import com.nntan041299.bookingservice.appointment.dto.TimeRange;
import com.nntan041299.bookingservice.appointment.entity.AppointmentStatus;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {


    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ServiceRepository serviceRepository;
    private final CurrentUserProvider currentUserProvider;

    /** Minutes a customer has to pay before the booking expires (see {@link AppointmentPaymentExpiryJob}). */
    @Value("${appointment.payment-expiry.window-minutes:5}")
    private long paymentWindowMinutes;

    /** Books the slot for the current customer as WAITING_PAYMENT; it is booked for everyone until paid, released or expired. */
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
                .serviceName(service.getName())
                .durationMinutes(service.getDurationMinutes())
                .startAt(start)
                .endAt(end)
                .price(service.getPrice())
                .status(AppointmentStatus.WAITING_PAYMENT)
                .note(request.getNote())
                .build());

        return toResponse(appointment, employee.getFullName());
    }

    /** Every active employee who offers the service, with their working ranges and booked slots on the day. */
    @Transactional(readOnly = true)
    public AvailabilityResponse availability(Long serviceId, LocalDate date) {
        ServiceOffering service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.SERVICE_NOT_FOUND.name()));
        if (!service.isActive()) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NOT_AVAILABLE.name());
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        int dayOfWeek = date.getDayOfWeek().getValue();

        List<Employee> employees = employeeRepository.findActiveByServiceId(service.getId());
        Map<Long, List<Appointment>> byEmployee = employees.isEmpty()
                ? Map.of()
                : appointmentRepository
                .findBusyByEmployeeIds(
                        employees.stream().map(Employee::getId).toList(), dayStart, dayEnd)
                .stream()
                .collect(Collectors.groupingBy(Appointment::getEmployeeId));

        List<EmployeeAvailability> result = employees.stream().map(employee -> {
            List<TimeRange> working = employee.getWorkingHours().stream()
                    .filter(range -> range.getDayOfWeek() == dayOfWeek)
                    .map(range -> new TimeRange(date.atTime(range.getStartTime()), date.atTime(range.getEndTime())))
                    .toList();
            List<TimeRange> busy = byEmployee.getOrDefault(employee.getId(), List.of()).stream()
                    .sorted(java.util.Comparator.comparing(Appointment::getStartAt))
                    .map(a -> new TimeRange(a.getStartAt(), a.getEndAt()))
                    .toList();
            int busyMinutes = busy.stream()
                    .mapToInt(range -> (int) Duration.between(
                            range.start().isBefore(dayStart) ? dayStart : range.start(),
                            range.end().isAfter(dayEnd) ? dayEnd : range.end()).toMinutes())
                    .sum();
            return new EmployeeAvailability(employee.getId(), employee.getFullName(), employee.getAvatarUrl(),
                    working, busy, busyMinutes);
        }).toList();

        return new AvailabilityResponse(service.getId(), service.getName(), service.getDurationMinutes(),
                service.getPrice(), service.getImageUrl(), date, result);
    }

    /** One of the current customer's appointments. */
    @Transactional(readOnly = true)
    public AppointmentResponse get(Long id) {
        Appointment appointment = findMine(id);
        return toResponse(appointment, employeeName(appointment));
    }

    /** How long a customer has to pay before the booking expires. */
    public Duration paymentWindow() {
        return Duration.ofMinutes(paymentWindowMinutes);
    }

    /**
     * Marks a WAITING_PAYMENT booking as PAID. Paying twice is a no-op. Until a payment provider is wired in,
     * the customer triggers this; later the provider's payment webhook should call it instead.
     */
    @Transactional
    public AppointmentResponse pay(Long id, PayAppointmentRequest request) {
        Appointment appointment = findMine(id);
        boolean paymentWindowOver = appointment.getCreatedAt().plus(paymentWindow()).isBefore(LocalDateTime.now());
        if (appointment.getStatus() == AppointmentStatus.EXPIRED
                || appointment.getStatus() == AppointmentStatus.WAITING_PAYMENT && paymentWindowOver) {
            throw new IllegalArgumentException(ErrorCode.APPOINTMENT_EXPIRED.name());
        }
        if (appointment.getStatus() == AppointmentStatus.WAITING_PAYMENT) {
            appointment.setStatus(AppointmentStatus.PAID);
            appointment.setPaid(true);
            appointment.setPaidAt(LocalDateTime.now());
            if (request != null && request.getNote() != null) {
                appointment.setNote(request.getNote().isBlank() ? null : request.getNote().trim());
            }
        }
        return toResponse(appointment, employeeName(appointment));
    }

    /** Drops a WAITING_PAYMENT booking so its slot is free again, e.g. when the customer picks another time. */
    @Transactional
    public void release(Long id) {
        Appointment appointment = findMine(id);
        if (appointment.getStatus() != AppointmentStatus.WAITING_PAYMENT) {
            throw new IllegalArgumentException(ErrorCode.INVALID_REQUEST.name());
        }
        appointmentRepository.delete(appointment);
    }

    private Appointment findMine(Long id) {
        String username = currentUserProvider.getCurrentUsername();
        return appointmentRepository.findByIdAndCustomerUsername(id, username)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.APPOINTMENT_NOT_FOUND.name()));
    }

    private String employeeName(Appointment appointment) {
        return employeeRepository.findById(appointment.getEmployeeId()).map(Employee::getFullName).orElse("");
    }

    /** The current customer's appointments, latest first. */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> listMine() {
        List<Appointment> appointments = appointmentRepository
                .findByCustomerIdOrderByStartAtDesc(currentUserProvider.getCurrentUser().getId());
        Map<Long, String> employeeNames = employeeRepository
                .findAllById(appointments.stream().map(Appointment::getEmployeeId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Employee::getId, Employee::getFullName));
        return appointments.stream()
                .map(a -> toResponse(a, employeeNames.getOrDefault(a.getEmployeeId(), "")))
                .toList();
    }

    /** The status the customer sees: the stored status, or for a paid booking UPCOMING/COMPLETED by time. */
    private AppointmentViewStatus viewStatus(Appointment appointment) {
        return switch (appointment.getStatus()) {
            case WAITING_PAYMENT -> AppointmentViewStatus.WAITING_PAYMENT;
            case EXPIRED -> AppointmentViewStatus.EXPIRED;
            default -> {
                if (appointment.getEndAt().isAfter(LocalDateTime.now())) {
                    yield AppointmentViewStatus.UPCOMING;
                }
                yield AppointmentViewStatus.COMPLETED;
            }
        };
    }

    private AppointmentResponse toResponse(Appointment appointment, String employeeName) {
        AppointmentViewStatus status = viewStatus(appointment);
        return new AppointmentResponse(appointment.getId(), appointment.getCustomerId(),
                appointment.getEmployeeId(), employeeName, appointment.getServiceId(),
                appointment.getServiceName(), appointment.getDurationMinutes(),
                appointment.getStartAt(), appointment.getEndAt(), appointment.getPrice(),
                appointment.isPaid(), status, appointment.getNote());
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
