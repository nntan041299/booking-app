package com.nntan041299.bookingservice.catalog.repository;

import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<ServiceOffering, Long> {

    boolean existsByNameIgnoreCase(String name);
}
