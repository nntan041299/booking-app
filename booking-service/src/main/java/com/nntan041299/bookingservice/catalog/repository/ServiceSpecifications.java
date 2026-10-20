package com.nntan041299.bookingservice.catalog.repository;

import com.nntan041299.bookingservice.catalog.dto.ServiceSearchCriteria;
import com.nntan041299.bookingservice.catalog.entity.ServiceOffering;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;

public final class ServiceSpecifications {

    private ServiceSpecifications() {
    }

    public static Specification<ServiceOffering> from(ServiceSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(criteria.keyword())) {
                String pattern = "%" + escapeLike(criteria.keyword().trim().toLowerCase()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern, '\\'),
                        cb.like(cb.lower(root.get("description")), pattern, '\\')));
            }
            if (criteria.active() != null) {
                predicates.add(cb.equal(root.get("active"), criteria.active()));
            }
            if (criteria.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), criteria.minPrice()));
            }
            if (criteria.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), criteria.maxPrice()));
            }
            if (criteria.minDuration() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("durationMinutes"), criteria.minDuration()));
            }
            if (criteria.maxDuration() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("durationMinutes"), criteria.maxDuration()));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
