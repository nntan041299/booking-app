package com.nntan041299.bookingservice.appointment.repository;

import com.nntan041299.bookingservice.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** A customer's appointments, latest first. */
    List<Appointment> findByCustomerIdOrderByStartAtDesc(Long customerId);

    /** True if the employee already has an appointment overlapping [start, end). Touching ranges do not overlap. */
    @Query("""
            select count(a) > 0 from Appointment a
            where a.employeeId = :employeeId and a.startAt < :end and a.endAt > :start
            """)
    boolean existsOverlapping(@Param("employeeId") Long employeeId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);
}
