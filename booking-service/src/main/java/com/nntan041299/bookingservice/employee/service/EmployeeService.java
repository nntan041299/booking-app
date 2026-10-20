package com.nntan041299.bookingservice.employee.service;

import com.nntan041299.bookingservice.auth.entity.Role;
import com.nntan041299.bookingservice.auth.entity.User;
import com.nntan041299.bookingservice.auth.repository.UserRepository;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.employee.dto.CreateEmployeeRequest;
import com.nntan041299.bookingservice.employee.dto.EmployeeResponse;
import com.nntan041299.bookingservice.employee.entity.Employee;
import com.nntan041299.bookingservice.employee.mapper.EmployeeMapper;
import com.nntan041299.bookingservice.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
