package com.nntan041299.bookingservice.employee.repository;

import com.nntan041299.bookingservice.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}
