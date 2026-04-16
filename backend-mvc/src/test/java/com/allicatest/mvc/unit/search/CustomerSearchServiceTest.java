package com.allicatest.mvc.unit.search;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.allicatest.mvc.customer.*;
import com.allicatest.mvc.customer.search.*;

/**
 * Search tests run against the real Hibernate Search Lucene backend (in-memory).
 * @Transactional + saveAllAndFlush ensures entities are indexed before assertions.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@WithMockUser(authorities = "SCOPE_customers:read")
@DisplayName("CustomerSearchService")
class CustomerSearchServiceTest {

    @Autowired
    CustomerSearchService searchService;

    @Autowired
    CustomerRepository repository;

    @Autowired
    jakarta.persistence.EntityManager entityManager;

    @BeforeEach
    void seed() {
        // Clear database and index for a clean slate every test
        repository.deleteAllInBatch();
        org.hibernate.search.mapper.orm.Search.session(entityManager)
                .workspace(Customer.class)
                .purge();

        repository.saveAllAndFlush(List.of(
                Customer.builder()
                        .firstName("TestAlice")
                        .lastName("Smith")
                        .dateOfBirth(LocalDate.of(1985, 3, 10))
                        .build(),
                Customer.builder()
                        .firstName("TestBob")
                        .lastName("Smith")
                        .dateOfBirth(LocalDate.of(1990, 7, 22))
                        .build(),
                Customer.builder()
                        .firstName("TestCarol")
                        .lastName("White")
                        .dateOfBirth(LocalDate.of(1978, 11, 5))
                        .build(),
                Customer.builder()
                        .firstName("TestAlicia")
                        .lastName("Johnson")
                        .dateOfBirth(LocalDate.of(1995, 6, 15))
                        .build(),
                Customer.builder()
                        .firstName("TestJonathan")
                        .lastName("Brown")
                        .dateOfBirth(LocalDate.of(1988, 2, 28))
                        .build()));
        // Force indexing to complete before assertions
        org.hibernate.search.mapper.orm.Search.session(entityManager)
                .indexingPlan()
                .execute();
    }

    @Test
    @DisplayName("matches by firstName — case insensitive")
    void search_byFirstName() {
        var result = searchService.search(SearchDTO.SearchRequest.of("TESTALICE"));
        assertThat(result.totalHits()).isGreaterThanOrEqualTo(1);
        assertThat(result.results())
                .anyMatch(h -> h.firstName().equalsIgnoreCase("testalice")
                        || h.firstName().equalsIgnoreCase("testalicia"));
    }

    @Test
    @DisplayName("matches across both firstName and lastName")
    void search_crossField() {
        var result = searchService.search(SearchDTO.SearchRequest.of("smith"));
        // Finds both "Smith" and "Smithson"
        assertThat(result.totalHits()).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("returns empty when no match")
    void search_noMatch() {
        var result = searchService.search(SearchDTO.SearchRequest.of("zzznomatch"));
        assertThat(result.totalHits()).isEqualTo(0);
        assertThat(result.results()).isEmpty();
    }

    @Test
    @DisplayName("returns all when no query or filters")
    void search_noQuery_returnsAll() {
        var result = searchService.search(
                new SearchDTO.SearchRequest(null, null, null, null, null, false, 0, 20, "lastName", "ASC"));
        assertThat(result.totalHits()).isEqualTo(5);
    }

    @Test
    @DisplayName("fuzzy finds results with typos")
    void search_fuzzy_typoTolerant() {
        // "TestAlic" → finds "TestAlice" and "TestAlicia"
        var fuzzy = searchService.search(
                new SearchDTO.SearchRequest("TestAlic", null, null, null, null, true, 0, 20, "lastName", "ASC"));
        var strict = searchService.search(
                new SearchDTO.SearchRequest("TestAlic", null, null, null, null, false, 0, 20, "lastName", "ASC"));

        assertThat(fuzzy.totalHits()).isGreaterThanOrEqualTo(strict.totalHits());
        assertThat(fuzzy.results()).anyMatch(h -> h.firstName().startsWith("TestAli"));
    }

    @Test
    @DisplayName("date range filter returns customers born in given range")
    void search_dobRange() {
        var result = searchService.search(new SearchDTO.SearchRequest(
                null,
                null,
                null,
                LocalDate.of(1980, 1, 1),
                LocalDate.of(1989, 12, 31),
                false,
                0,
                20,
                "lastName",
                "ASC"));

        // Alice (1985) and Jonathan (1988) are in range
        assertThat(result.totalHits()).isGreaterThanOrEqualTo(2);
        result.results().forEach(h -> {
            LocalDate dob = LocalDate.parse(h.dateOfBirth());
            assertThat(dob).isBetween(LocalDate.of(1980, 1, 1), LocalDate.of(1989, 12, 31));
        });
    }

    @Test
    @DisplayName("pagination returns correct page size")
    void search_pagination() {
        var page0 = searchService.search(
                new SearchDTO.SearchRequest(null, null, null, null, null, false, 0, 2, "lastName", "ASC"));
        var page1 = searchService.search(
                new SearchDTO.SearchRequest(null, null, null, null, null, false, 1, 2, "lastName", "ASC"));

        assertThat(page0.results()).hasSize(2);
        assertThat(page1.results()).hasSize(2);
        assertThat(page0.results().get(0).id())
                .isNotEqualTo(page1.results().get(0).id());
    }

    @Test
    @DisplayName("totalPages is calculated correctly")
    void search_totalPages() {
        var result = searchService.search(
                new SearchDTO.SearchRequest(null, null, null, null, null, false, 0, 2, "lastName", "ASC"));
        // 5 customers, page size 2 → ceil(5/2) = 3 pages
        assertThat(result.totalPages()).isEqualTo(3);
    }

    @Test
    @DisplayName("suggest returns prefix matches")
    void suggest_returnsMatches() {
        assertThat(searchService.suggest("testali", 5)).isNotEmpty();
    }

    @Test
    @DisplayName("suggest returns empty for single character")
    void suggest_tooShort() {
        assertThat(searchService.suggest("a", 5)).isEmpty();
    }

    @Test
    @DisplayName("response includes query and timing metadata")
    void search_metadata() {
        var result = searchService.search(SearchDTO.SearchRequest.of("testalice"));
        assertThat(result.query()).isEqualTo("testalice");
        assertThat(result.took()).isGreaterThanOrEqualTo(0);
    }
}
