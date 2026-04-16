package com.allicatest.mvc.customer.v2;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.allicatest.mvc.customer.CustomerDTO;
import com.allicatest.mvc.customer.CustomerService;

import lombok.RequiredArgsConstructor;

/**
 * V2 controller — same service, enriched response (fullName, email, status, updatedAt).
 * V1 endpoints remain completely unchanged.
 */
@RestController
@RequestMapping("/api/v2/customers")
@RequiredArgsConstructor
public class CustomerV2Controller {

    private final CustomerService service;

    @PostMapping
    public ResponseEntity<CustomerDTO.V2Response> create(@Valid @RequestBody CustomerDTO.CreateRequest request) {
        CustomerDTO.V1Response v1 = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.findByIdV2(v1.id()));
    }

    @GetMapping
    public ResponseEntity<List<CustomerDTO.V2Response>> findAll() {
        return ResponseEntity.ok(service.findAllV2());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO.V2Response> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findByIdV2(id));
    }
}
