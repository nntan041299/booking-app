package com.nntan041299.bookingservice.resource.dto;

import com.nntan041299.bookingservice.resource.entity.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    private String description;

    @Size(max = 255, message = "Image URL must not exceed 255 characters")
    private String imageUrl;

    /** The services that can use this resource. Optional; empty means none. */
    private Set<Long> serviceIds;
}
