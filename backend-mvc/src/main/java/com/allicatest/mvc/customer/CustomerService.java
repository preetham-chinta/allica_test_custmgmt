package com.allicatest.mvc.customer;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.allicatest.mvc.exception.CustomerAlreadyExistsException;
import com.allicatest.mvc.exception.CustomerNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository repository;

    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_customers:write')")
    public CustomerDTO.V1Response create(CustomerDTO.CreateRequest request) {
        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();

        if (repository.existsByFirstNameAndLastNameAndDateOfBirth(firstName, lastName, request.dateOfBirth())) {
            throw new CustomerAlreadyExistsException(firstName, lastName);
        }

        Customer saved = repository.save(Customer.builder()
                .firstName(firstName)
                .lastName(lastName)
                .dateOfBirth(request.dateOfBirth())
                .build());

        log.info("Customer created id={} name={} {}", saved.getId(), firstName, lastName);
        return CustomerDTO.V1Response.from(saved);
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public List<CustomerDTO.V1Response> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(CustomerDTO.V1Response::from)
                .toList();
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public CustomerDTO.V1Response findById(Long id) {
        return repository
                .findById(id)
                .map(CustomerDTO.V1Response::from)
                .orElseThrow(() -> new CustomerNotFoundException(id));
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public List<CustomerDTO.V2Response> findAllV2() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(CustomerDTO.V2Response::from)
                .toList();
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public CustomerDTO.V2Response findByIdV2(Long id) {
        return repository
                .findById(id)
                .map(CustomerDTO.V2Response::from)
                .orElseThrow(() -> new CustomerNotFoundException(id));
    }
}
