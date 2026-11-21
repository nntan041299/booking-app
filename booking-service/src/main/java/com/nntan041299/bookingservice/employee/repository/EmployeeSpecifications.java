package com.nntan041299.bookingservice.employee.repository;

import com.nntan041299.bookingservice.employee.dto.EmployeeSearchCriteria;
import com.nntan041299.bookingservice.employee.entity.Employee;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class EmployeeSpecifications {

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> from(EmployeeSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(criteria.keyword())) {
                String pattern = "%" + escapeLike(criteria.keyword().trim().toLowerCase()) + "%";
                predicates.add(cb.like(cb.lower(root.get("fullName")), pattern, '\\'));
            }
            if (criteria.active() != null) {
                predicates.add(cb.equal(root.get("active"), criteria.active()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
