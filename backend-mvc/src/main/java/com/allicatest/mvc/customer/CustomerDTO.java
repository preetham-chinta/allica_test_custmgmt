package com.allicatest.mvc.customer;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.*;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request and response shapes.
 *
 * Java records give us immutability, equals/hashCode, and toString for free.
 *
 * V1Response — frozen. Once released, never change field names or types.
 * V2Response — additive only. New fields added here, V1 untouched.
 */
public class CustomerDTO {

    public record CreateRequest(
            @NotBlank(message = "First name is required") @Size(max = 100) String firstName,
            @NotBlank(message = "Last name is required") @Size(max = 100) String lastName,
            @NotNull(message = "Date of birth is required") @Past(message = "Date of birth must be in the past")
                    LocalDate dateOfBirth) {}

    /** V1 — original shape, frozen forever */
    public record V1Response(
            Long id, String firstName, String lastName, LocalDate dateOfBirth, LocalDateTime createdAt) {
        public static V1Response from(Customer c) {
            return new V1Response(c.getId(), c.getFirstName(), c.getLastName(), c.getDateOfBirth(), c.getCreatedAt());
        }
    }

    /**
     * V2 — extends V1 with fullName, email, status, updatedAt.
     * @JsonInclude(NON_NULL) so rows created before V2 migration don't break.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record V2Response(
            Long id,
            String firstName,
            String lastName,
            String fullName,
            LocalDate dateOfBirth,
            String email,
            String status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        public static V2Response from(Customer c) {
            return new V2Response(
                    c.getId(),
                    c.getFirstName(),
                    c.getLastName(),
                    c.getFirstName() + " " + c.getLastName(),
                    c.getDateOfBirth(),
                    c.getEmail(),
                    c.getStatus(),
                    c.getCreatedAt(),
                    c.getUpdatedAt());
        }
    }

    public record ErrorResponse(int status, String error, String message) {}
}
