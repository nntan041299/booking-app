package com.nntan041299.bookingservice.resource.mapper;

import com.nntan041299.bookingservice.resource.dto.ResourceResponse;
import com.nntan041299.bookingservice.resource.entity.BookingResource;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ResourceMapper {

    ResourceResponse toResponse(BookingResource resource);
}
