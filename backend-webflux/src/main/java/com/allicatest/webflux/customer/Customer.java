package com.allicatest.webflux.customer;

import java.time.*;

import org.springframework.data.annotation.*;
import org.springframework.data.relational.core.mapping.*;

import lombok.*;

/**
 * R2DBC entity — NOT a JPA entity.
 *
 * Key differences from MVC's Customer.java:
 * - @Id from spring-data (not jakarta.persistence)
 * - @Table from spring-data-relational (not jakarta.persistence)
 * - No lazy loading, no Hibernate session scope
 * - No Hibernate Search annotations — WebFlux search delegates to a separate
 *   Elasticsearch client or calls the MVC search service
 */
@Table("customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    private Long id;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    @Column("date_of_birth")
    private LocalDate dateOfBirth;

    @Column("email")
    private String email;

    @Column("status")
    @Builder.Default
    private String status = "ACTIVE";

    @Column("created_at")
    @CreatedDate
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
