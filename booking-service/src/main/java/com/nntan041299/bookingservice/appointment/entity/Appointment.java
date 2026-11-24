package com.nntan041299.bookingservice.appointment.entity;

import com.nntan041299.bookingservice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    /** Snapshot of the service name at booking time, so editing the service leaves past bookings as booked. */
    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    /** Snapshot of the service duration (minutes) at booking time. */
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    /** start_at + the service duration. */
    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    /** Snapshot of the service price at booking time. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.WAITING_PAYMENT;

    @Column(name = "is_paid", nullable = false)
    private boolean paid;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(columnDefinition = "TEXT")
    private String note;
}
