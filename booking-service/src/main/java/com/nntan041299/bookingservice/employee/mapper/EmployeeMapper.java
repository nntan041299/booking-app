package com.nntan041299.bookingservice.employee.mapper;

import com.nntan041299.bookingservice.employee.dto.EmployeeResponse;
import com.nntan041299.bookingservice.employee.dto.WorkingHoursResponse;
import com.nntan041299.bookingservice.employee.entity.Employee;
import com.nntan041299.bookingservice.employee.entity.EmployeeWorkingHours;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    EmployeeResponse toResponse(Employee employee);

    WorkingHoursResponse toResponse(EmployeeWorkingHours workingHours);
}
