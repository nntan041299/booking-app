package com.nntan041299.bookingservice.catalog.service;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import com.nntan041299.bookingservice.catalog.mapper.ServiceMapper;
import com.nntan041299.bookingservice.catalog.repository.ServiceRepository;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final ServiceMapper serviceMapper;

    public ServiceResponse create(CreateServiceRequest request) {
        String name = request.getName().trim();
        if (serviceRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NAME_ALREADY_EXISTS.name());
        }

        ServiceOffering service = ServiceOffering.builder()
                .name(name)
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .build();

        return serviceMapper.toResponse(serviceRepository.save(service));
    }
}
