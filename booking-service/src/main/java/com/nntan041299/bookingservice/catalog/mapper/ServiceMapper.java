package com.nntan041299.bookingservice.catalog.mapper;

import com.nntan041299.bookingservice.catalog.dto.ServiceResponse;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ServiceMapper {

    ServiceResponse toResponse(ServiceOffering service);
}
