package com.nntan041299.bookingservice.resource.dto;

import com.nntan041299.bookingservice.resource.entity.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Set;

@Getter
@AllArgsConstructor
public class ResourceResponse {

    private Long id;
    private String name;
    private ResourceType type;
    private String description;
    private String imageUrl;
    private boolean active;
    private Set<Long> serviceIds;
}
