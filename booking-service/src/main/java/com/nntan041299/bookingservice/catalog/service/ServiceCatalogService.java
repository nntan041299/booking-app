package com.nntan041299.bookingservice.catalog.service;

import com.nntan041299.bookingservice.catalog.dto.CreateServiceRequest;
import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.dto.ServiceSearchCriteria;
import com.nntan041299.bookingservice.catalog.dto.UpdateServiceRequest;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import com.nntan041299.bookingservice.catalog.mapper.ServiceMapper;
import com.nntan041299.bookingservice.catalog.repository.ServiceRepository;
import com.nntan041299.bookingservice.catalog.repository.ServiceSpecifications;
import com.nntan041299.bookingservice.common.dto.PageResponse;
import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.media.dto.ImageFolder;
import com.nntan041299.bookingservice.media.service.ImageUploadService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ServiceRepository serviceRepository;
    private final ServiceMapper serviceMapper;
    private final ImageUploadService imageUploadService;

    @Transactional
    public ServiceResponse create(CreateServiceRequest request, MultipartFile image) {
        String name = request.getName().trim();
        if (serviceRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NAME_ALREADY_EXISTS.name());
        }

        ServiceOffering service = ServiceOffering.builder()
                .name(name)
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .imageUrl(imageUploadService.uploadInTransaction(image, ImageFolder.SERVICES))
                .build();

        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    @Transactional
    public ServiceResponse update(Long id, UpdateServiceRequest request, MultipartFile image) {
        ServiceOffering service = serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.SERVICE_NOT_FOUND.name()));

        String name = request.getName().trim();
        if (serviceRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException(ErrorCode.SERVICE_NAME_ALREADY_EXISTS.name());
        }

        service.setName(name);
        service.setDescription(request.getDescription());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setPrice(request.getPrice());
        String newImageUrl = imageUploadService.uploadInTransaction(image, ImageFolder.SERVICES);
        if (newImageUrl != null || Boolean.TRUE.equals(request.getRemoveImage())) {
            String oldImageUrl = service.getImageUrl();
            service.setImageUrl(newImageUrl);
            if (oldImageUrl != null) {
                imageUploadService.deleteByUrlAfterCommit(oldImageUrl);
            }
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }
        return serviceMapper.toResponse(serviceRepository.save(service));
    }

    /**
     * Removing a service deactivates it rather than deleting the row: appointments and employee
     * assignments reference it, and customers stop seeing it. Idempotent.
     */
    @Transactional
    public void remove(Long id) {
        ServiceOffering service = serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.SERVICE_NOT_FOUND.name()));
        service.setActive(false);
        serviceRepository.save(service);
    }

    public PageResponse<ServiceResponse> search(ServiceSearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by("name").ascending());
        return PageResponse.from(serviceRepository.findAll(ServiceSpecifications.from(criteria), pageable).map(serviceMapper::toResponse));
    }
}
