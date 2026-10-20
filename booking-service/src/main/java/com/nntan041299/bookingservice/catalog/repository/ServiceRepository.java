package com.nntan041299.bookingservice.catalog.repository;

import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ServiceRepository extends JpaRepository<ServiceOffering, Long>, JpaSpecificationExecutor<ServiceOffering> {

    boolean existsByNameIgnoreCase(String name);
}
