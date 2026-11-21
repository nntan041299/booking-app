package com.nntan041299.bookingservice.resource.repository;

import com.nntan041299.bookingservice.resource.dto.ResourceSearchCriteria;
import com.nntan041299.bookingservice.resource.entity.BookingResource;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class ResourceSpecifications {

    private ResourceSpecifications() {
    }

    public static Specification<BookingResource> from(ResourceSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(criteria.keyword())) {
                String pattern = "%" + escapeLike(criteria.keyword().trim().toLowerCase()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern, '\\'),
                        cb.like(cb.lower(root.get("description")), pattern, '\\')));
            }
            if (criteria.type() != null) {
                predicates.add(cb.equal(root.get("type"), criteria.type()));
            }
            if (criteria.active() != null) {
                predicates.add(cb.equal(root.get("active"), criteria.active()));
            }
            if (criteria.serviceId() != null) {
                predicates.add(cb.isMember(criteria.serviceId(), root.<Set<Long>>get("serviceIds")));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
