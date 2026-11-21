package com.nntan041299.bookingservice.employee.service;

import com.nntan041299.bookingservice.auth.entity.Role;
import com.nntan041299.bookingservice.auth.entity.User;
import com.nntan041299.bookingservice.auth.repository.UserRepository;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.employee.dto.CreateEmployeeRequest;
import com.nntan041299.bookingservice.employee.dto.EmployeeResponse;
import com.nntan041299.bookingservice.employee.dto.UpdateEmployeeRequest;
import com.nntan041299.bookingservice.employee.dto.WorkingHoursRequest;
import com.nntan041299.bookingservice.employee.entity.Employee;
import com.nntan041299.bookingservice.employee.entity.EmployeeWorkingHours;
import com.nntan041299.bookingservice.employee.mapper.EmployeeMapper;
import com.nntan041299.bookingservice.employee.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeMapper employeeMapper;

    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException(ErrorCode.USERNAME_ALREADY_EXISTS.name());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(ErrorCode.EMAIL_ALREADY_EXISTS.name());
        }

        User user = userRepository.save(User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.EMPLOYEE)
                .isActive(true)
                .build());

        Employee employee = Employee.builder()
                .userId(user.getId())
                .fullName(request.getFullName().trim())
                .avatarUrl(request.getAvatarUrl())
                .build();

        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse update(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.EMPLOYEE_NOT_FOUND.name()));

        if (request.getFullName() != null) {
            employee.setFullName(request.getFullName().trim());
        }
        if (request.getBio() != null) {
            employee.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            employee.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getActive() != null) {
            employee.setActive(request.getActive());
        }
        if (request.getWorkingHours() != null) {
            replaceWorkingHours(employee, request.getWorkingHours());
        }

        syncLinkedUser(employee, request);

        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    /** Keeps the login account's display name and enabled flag consistent with the employee profile. */
    private void syncLinkedUser(Employee employee, UpdateEmployeeRequest request) {
        if (employee.getUserId() == null || (request.getFullName() == null && request.getActive() == null)) {
            return;
        }
        userRepository.findById(employee.getUserId()).ifPresent(user -> {
            if (request.getFullName() != null) {
                user.setFullName(employee.getFullName());
            }
            if (request.getActive() != null) {
                user.setActive(employee.isActive());
            }
            userRepository.save(user);
        });
    }

    private void replaceWorkingHours(Employee employee, List<WorkingHoursRequest> requested) {
        validateWorkingHours(requested);

        employee.getWorkingHours().clear();
        requested.forEach(item -> employee.getWorkingHours().add(EmployeeWorkingHours.builder()
                .dayOfWeek(item.getDayOfWeek())
                .startTime(item.getStartTime())
                .endTime(item.getEndTime())
                .build()));
    }

    /** Each range needs start < end, and ranges on the same day must not overlap (touching is allowed). */
    private void validateWorkingHours(List<WorkingHoursRequest> requested) {
        List<WorkingHoursRequest> sorted = requested.stream()
                .sorted(Comparator.comparing(WorkingHoursRequest::getDayOfWeek)
                        .thenComparing(WorkingHoursRequest::getStartTime))
                .toList();

        WorkingHoursRequest previous = null;
        for (WorkingHoursRequest current : sorted) {
            if (!current.getStartTime().isBefore(current.getEndTime())) {
                throw new IllegalArgumentException(ErrorCode.INVALID_WORKING_HOURS.name());
            }
            if (previous != null
                    && previous.getDayOfWeek().equals(current.getDayOfWeek())
                    && current.getStartTime().isBefore(previous.getEndTime())) {
                throw new IllegalArgumentException(ErrorCode.INVALID_WORKING_HOURS.name());
            }
            previous = current;
        }
    }
}
