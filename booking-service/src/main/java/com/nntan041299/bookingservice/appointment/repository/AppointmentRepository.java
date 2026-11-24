package com.nntan041299.bookingservice.appointment.repository;

import com.nntan041299.bookingservice.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** A customer's appointments, latest first. */
    List<Appointment> findByCustomerIdOrderByStartAtDesc(Long customerId);

    /** Appointments of the given employees that overlap [dayStart, dayEnd), whoever booked them. Expired holds are left out. */
    @Query("""
            select a from Appointment a
            where a.employeeId in :employeeIds and a.startAt < :dayEnd and a.endAt > :dayStart
              and a.status <> com.nntan041299.bookingservice.appointment.entity.AppointmentStatus.EXPIRED
            """)
    List<Appointment> findBusyByEmployeeIds(@Param("employeeIds") Collection<Long> employeeIds,
                                            @Param("dayStart") LocalDateTime dayStart,
                                            @Param("dayEnd") LocalDateTime dayEnd);

    /** True if the employee already has a live appointment overlapping [start, end) (expired holds do not count). Touching ranges do not overlap. */
    @Query("""
            select count(a) > 0 from Appointment a
            where a.employeeId = :employeeId and a.startAt < :end and a.endAt > :start
              and a.status <> com.nntan041299.bookingservice.appointment.entity.AppointmentStatus.EXPIRED
            """)
    boolean existsOverlapping(@Param("employeeId") Long employeeId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);

    /** One appointment, only if it belongs to the user with the given username (a single query). */
    @Query("""
            select a from Appointment a
            where a.id = :id
              and a.customerId = (select u.id from User u where u.username = :username)
            """)
    Optional<Appointment> findByIdAndCustomerUsername(@Param("id") Long id, @Param("username") String username);

    /** Marks WAITING_PAYMENT bookings created before {@code cutoff} as EXPIRED. Returns how many changed. */
    @Modifying
    @Query("""
            update Appointment a
            set a.status = com.nntan041299.bookingservice.appointment.entity.AppointmentStatus.EXPIRED,
                a.updatedAt = :now
            where a.status = com.nntan041299.bookingservice.appointment.entity.AppointmentStatus.WAITING_PAYMENT
              and a.createdAt < :cutoff
            """)
    int expireUnpaid(@Param("cutoff") LocalDateTime cutoff, @Param("now") LocalDateTime now);
}
