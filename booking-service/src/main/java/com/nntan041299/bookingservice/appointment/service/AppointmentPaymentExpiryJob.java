package com.nntan041299.bookingservice.appointment.service;

import com.nntan041299.bookingservice.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Marks bookings the customer did not pay for in time as EXPIRED, which frees their slot. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentPaymentExpiryJob {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;

    @Scheduled(fixedRateString = "${appointment.payment-expiry.check-interval-ms:60000}")
    @Transactional
    public void expireUnpaidBookings() {
        LocalDateTime now = LocalDateTime.now();
        int expired = appointmentRepository.expireUnpaid(now.minus(appointmentService.paymentWindow()), now);
        if (expired > 0) {
            log.info("Marked {} unpaid booking(s) as EXPIRED", expired);
        }
    }
}
