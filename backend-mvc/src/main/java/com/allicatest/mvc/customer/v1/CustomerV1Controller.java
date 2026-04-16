package com.allicatest.mvc.customer.v1;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.allicatest.mvc.customer.CustomerDTO;
import com.allicatest.mvc.customer.CustomerService;

import lombok.RequiredArgsConstructor;

/**
 * V1 controller — contract frozen after release.
 * Adding fields, changing types, or renaming → create a V2 endpoint instead.
 */
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerV1Controller {

    private final CustomerService service;

    @PostMapping
    public ResponseEntity<CustomerDTO.V1Response> create(@Valid @RequestBody CustomerDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerDTO.V1Response>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO.V1Response> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}
