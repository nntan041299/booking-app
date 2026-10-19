package com.nntan041299.bookingservice.auth.mapper;

import com.nntan041299.bookingservice.auth.dto.UserResponse;
import com.nntan041299.bookingservice.auth.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}
