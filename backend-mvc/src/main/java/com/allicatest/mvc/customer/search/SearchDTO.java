package com.allicatest.mvc.customer.search;

import java.time.LocalDate;
import java.util.List;

public class SearchDTO {

    public record SearchRequest(
            String query,
            String firstName,
            String lastName,
            LocalDate dobFrom,
            LocalDate dobTo,
            boolean fuzzy,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        public SearchRequest {
            if (page < 0) page = 0;
            if (size < 1) size = 20;
            if (size > 100) size = 100;
            if (sortBy == null || sortBy.isBlank()) sortBy = "lastName";
            if (sortDir == null || sortDir.isBlank()) sortDir = "ASC";
        }

        public static SearchRequest of(String query) {
            return new SearchRequest(query, null, null, null, null, false, 0, 20, "lastName", "ASC");
        }
    }

    public record SearchResult(
            List<SearchHit> results, long totalHits, int totalPages, int page, int size, String query, long took) {}

    public record SearchHit(Long id, String firstName, String lastName, String dateOfBirth, float score) {}
}
