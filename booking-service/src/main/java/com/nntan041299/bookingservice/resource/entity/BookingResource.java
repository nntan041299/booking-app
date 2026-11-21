package com.nntan041299.bookingservice.resource.entity;

import com.nntan041299.bookingservice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/** A room or piece of equipment that can be shared by several services. */
@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResource extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ElementCollection
    @CollectionTable(name = "resource_services", joinColumns = @JoinColumn(name = "resource_id"))
    @Column(name = "service_id")
    @Builder.Default
    private Set<Long> serviceIds = new HashSet<>();
}
