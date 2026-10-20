package com.nntan041299.bookingservice.catalog.service;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.dto.ServiceSearchCriteria;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import com.nntan041299.bookingservice.catalog.mapper.ServiceMapper;
import com.nntan041299.bookingservice.catalog.repository.ServiceRepository;
import com.nntan041299.bookingservice.catalog.repository.ServiceSpecifications;
import com.nntan041299.bookingservice.common.dto.PageResponse;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private static final int MAX_PAGE_SIZE = 100;

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

    public PageResponse<ServiceResponse> search(ServiceSearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by("name").ascending());
        return PageResponse.from(serviceRepository.findAll(ServiceSpecifications.from(criteria), pageable).map(serviceMapper::toResponse));
    }
}
