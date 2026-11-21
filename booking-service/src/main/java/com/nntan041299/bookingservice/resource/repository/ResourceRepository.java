package com.nntan041299.bookingservice.resource.repository;

import com.nntan041299.bookingservice.resource.entity.BookingResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ResourceRepository extends JpaRepository<BookingResource, Long>, JpaSpecificationExecutor<BookingResource> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
