package com.allicatest.mvc.customer;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import org.hibernate.search.engine.backend.types.*;
import org.hibernate.search.mapper.pojo.mapping.definition.annotation.*;

import lombok.*;

/**
 * Customer entity.
 *
 * @Indexed — Hibernate Search keeps a Lucene index in sync with this table automatically.
 * Every JPA save/update/delete fires lifecycle events that update the index.
 *
 * Two field types used:
 *   @FullTextField  — tokenised, lowercased, stemmed → used for full-text search
 *   @KeywordField   — exact, unstemmed              → used for sorting
 *   (both are needed because an analysed field cannot be sorted in Lucene)
 */
@Entity
@Indexed(index = "customers")
@Table(
        name = "customers",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_customer_identity",
                        columnNames = {"first_name", "last_name", "date_of_birth"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    @FullTextField(analyzer = "standard", projectable = Projectable.YES)
    @KeywordField(name = "firstName_sort", sortable = Sortable.YES, searchable = Searchable.NO)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    @FullTextField(analyzer = "standard", projectable = Projectable.YES)
    @KeywordField(name = "lastName_sort", sortable = Sortable.YES, searchable = Searchable.NO)
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    @GenericField(sortable = Sortable.YES)
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    // Added in V2 migration
    @Column(length = 255)
    private String email;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @GenericField(sortable = Sortable.YES)
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
