package com.allicatest.webflux.customer;

import java.time.*;

import jakarta.validation.constraints.*;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Identical response shapes to the MVC module.
 * Frontend switches backends via an env var — zero frontend code changes required.
 */
public class CustomerDTO {

    public record CreateRequest(
            @NotBlank(message = "First name is required") @Size(max = 100) String firstName,
            @NotBlank(message = "Last name is required") @Size(max = 100) String lastName,
            @NotNull(message = "Date of birth is required") @Past(message = "Date of birth must be in the past")
                    LocalDate dateOfBirth) {}

    public record V1Response(
            Long id, String firstName, String lastName, LocalDate dateOfBirth, LocalDateTime createdAt) {
        public static V1Response from(Customer c) {
            return new V1Response(c.getId(), c.getFirstName(), c.getLastName(), c.getDateOfBirth(), c.getCreatedAt());
        }
    }

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
