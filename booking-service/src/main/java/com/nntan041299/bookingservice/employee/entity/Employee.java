package com.nntan041299.bookingservice.employee.entity;

import com.nntan041299.bookingservice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ElementCollection
    @CollectionTable(name = "employee_services", joinColumns = @JoinColumn(name = "employee_id"))
    @Column(name = "service_id")
    @Builder.Default
    private Set<Long> serviceIds = new HashSet<>();
}
