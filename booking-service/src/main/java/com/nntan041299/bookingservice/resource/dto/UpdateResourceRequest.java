package com.nntan041299.bookingservice.resource.dto;

import com.nntan041299.bookingservice.resource.entity.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Full update of the editable fields. {@code active} and {@code serviceIds} are optional and left
 * unchanged when null.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResourceRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    private String description;

    /** {@code true} clears the current image. Ignored when a new image file is sent. */
    private Boolean removeImage;

    private Boolean active;

    private Set<Long> serviceIds;
}
