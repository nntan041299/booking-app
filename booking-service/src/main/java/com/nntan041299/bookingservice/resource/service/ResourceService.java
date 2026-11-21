package com.nntan041299.bookingservice.resource.service;

import com.nntan041299.bookingservice.catalog.repository.ServiceRepository;
import com.nntan041299.bookingservice.common.dto.PageResponse;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.resource.dto.CreateResourceRequest;
import com.nntan041299.bookingservice.resource.dto.ResourceResponse;
import com.nntan041299.bookingservice.resource.dto.ResourceSearchCriteria;
import com.nntan041299.bookingservice.resource.dto.UpdateResourceRequest;
import com.nntan041299.bookingservice.resource.entity.BookingResource;
import com.nntan041299.bookingservice.resource.mapper.ResourceMapper;
import com.nntan041299.bookingservice.resource.repository.ResourceRepository;
import com.nntan041299.bookingservice.resource.repository.ResourceSpecifications;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ResourceRepository resourceRepository;
    private final ServiceRepository serviceRepository;
    private final ResourceMapper resourceMapper;

    @Transactional
    public ResourceResponse create(CreateResourceRequest request) {
        String name = request.getName().trim();
        if (resourceRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(ErrorCode.RESOURCE_NAME_ALREADY_EXISTS.name());
        }

        BookingResource resource = BookingResource.builder()
                .name(name)
                .type(request.getType())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();
        if (request.getServiceIds() != null) {
            replaceServices(resource, request.getServiceIds());
        }

        return resourceMapper.toResponse(resourceRepository.save(resource));
    }

    @Transactional(readOnly = true)
    public ResourceResponse get(Long id) {
        return resourceMapper.toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ResourceResponse> search(ResourceSearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by("name").ascending());
        return PageResponse.from(resourceRepository
                .findAll(ResourceSpecifications.from(criteria), pageable)
                .map(resourceMapper::toResponse));
    }

    @Transactional
    public ResourceResponse update(Long id, UpdateResourceRequest request) {
        BookingResource resource = find(id);

        String name = request.getName().trim();
        if (resourceRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException(ErrorCode.RESOURCE_NAME_ALREADY_EXISTS.name());
        }

        resource.setName(name);
        resource.setType(request.getType());
        resource.setDescription(request.getDescription());
        resource.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            resource.setActive(request.getActive());
        }
        if (request.getServiceIds() != null) {
            replaceServices(resource, request.getServiceIds());
        }
        return resourceMapper.toResponse(resourceRepository.save(resource));
    }

    /**
     * Removing a resource deactivates it rather than deleting the row, so history stays intact.
     * Idempotent.
     */
    @Transactional
    public void remove(Long id) {
        BookingResource resource = find(id);
        resource.setActive(false);
        resourceRepository.save(resource);
    }

    private BookingResource find(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.RESOURCE_NOT_FOUND.name()));
    }

    private void replaceServices(BookingResource resource, Set<Long> serviceIds) {
        if (serviceRepository.findAllById(serviceIds).size() != serviceIds.size()) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NOT_FOUND.name());
        }
        resource.getServiceIds().clear();
        resource.getServiceIds().addAll(serviceIds);
    }
}
