package com.allicatest.mvc.customer.search;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class CustomerSearchController {

    private final CustomerSearchService searchService;

    /** V1 — basic full-text search: GET /api/v1/customers/search?query=alice */
    @GetMapping("/api/v1/customers/search")
    public ResponseEntity<SearchDTO.SearchResult> searchV1(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        return ResponseEntity.ok(searchService.search(
                new SearchDTO.SearchRequest(query, null, null, null, null, false, page, size, sortBy, sortDir)));
    }

    /**
     * V2 — advanced search: POST /api/v2/customers/search
     * Body supports: fuzzy, firstName/lastName filters, dobFrom/dobTo date ranges.
     */
    @PostMapping("/api/v2/customers/search")
    public ResponseEntity<SearchDTO.SearchResult> searchV2(@RequestBody SearchDTO.SearchRequest request) {
        return ResponseEntity.ok(searchService.search(request));
    }

    /** Typeahead: GET /api/v2/customers/suggest?prefix=ali */
    @GetMapping("/api/v2/customers/suggest")
    public ResponseEntity<List<String>> suggest(
            @RequestParam String prefix, @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(searchService.suggest(prefix, Math.min(limit, 10)));
    }

    /** Rebuild search index: POST /api/v1/customers/reindex */
    @PostMapping("/api/v1/customers/reindex")
    @PreAuthorize("hasAuthority('SCOPE_customers:write')")
    public ResponseEntity<Map<String, String>> reindex() throws InterruptedException {
        searchService.reindexAll();
        return ResponseEntity.ok(Map.of("status", "reindex complete"));
    }
}
