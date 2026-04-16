package com.allicatest.mvc.customer.search;

import java.util.List;

import jakarta.persistence.EntityManager;

import org.hibernate.search.engine.search.sort.dsl.SortOrder;
import org.hibernate.search.mapper.orm.Search;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.allicatest.mvc.customer.Customer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerSearchService {

    private final EntityManager entityManager;

    /**
     * Main search — supports full-text, fuzzy matching, date ranges,
     * field-specific filters, sorting, and pagination.
     *
     * Lucene is used in dev/test (embedded, zero infra).
     * Switch to Elasticsearch in prod via one config property change.
     */
    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public SearchDTO.SearchResult search(SearchDTO.SearchRequest req) {
        long start = System.currentTimeMillis();

        var result = Search.session(entityManager)
                .search(Customer.class)
                .where(f -> f.bool(b -> {
                    boolean hasQuery = req.query() != null && !req.query().isBlank();

                    if (hasQuery) {
                        if (req.fuzzy()) {
                            b.must(f.bool(fb -> {
                                // Fuzzy: edit distance 1 catches typos ("Alic" → "Alice")
                                fb.should(f.match()
                                        .fields("firstName", "lastName")
                                        .matching(req.query())
                                        .fuzzy(1));
                                // Exact matches score higher than fuzzy
                                fb.should(f.match()
                                        .field("firstName")
                                        .boost(2f)
                                        .field("lastName")
                                        .matching(req.query()));
                            }));
                        } else {
                            b.must(f.match()
                                    .field("firstName")
                                    .boost(1.5f)
                                    .field("lastName")
                                    .matching(req.query()));
                        }
                    }

                    // Field-specific filters (AND — don't affect score)
                    if (req.firstName() != null && !req.firstName().isBlank())
                        b.filter(f.match().field("firstName").matching(req.firstName()));
                    if (req.lastName() != null && !req.lastName().isBlank())
                        b.filter(f.match().field("lastName").matching(req.lastName()));

                    // Date of birth range
                    if (req.dobFrom() != null || req.dobTo() != null)
                        b.filter(f.range().field("dateOfBirth").between(req.dobFrom(), req.dobTo()));

                    // No filters → match all (browse mode)
                    if (!hasQuery
                            && req.firstName() == null
                            && req.lastName() == null
                            && req.dobFrom() == null
                            && req.dobTo() == null) b.must(f.matchAll());
                }))
                .sort(s -> {
                    SortOrder order = "DESC".equalsIgnoreCase(req.sortDir()) ? SortOrder.DESC : SortOrder.ASC;
                    return (req.query() != null && !req.query().isBlank())
                            ? s.composite()
                                    .add(s.score())
                                    .add(s.field(req.sortBy() + "_sort").order(order))
                            : s.field(req.sortBy() + "_sort").order(order);
                })
                .fetch(req.page() * req.size(), req.size());

        long took = System.currentTimeMillis() - start;
        log.debug(
                "Search query='{}' hits={} took={}ms",
                req.query(),
                result.total().hitCount(),
                took);

        List<SearchDTO.SearchHit> hits = result.hits().stream()
                .map(c -> new SearchDTO.SearchHit(
                        c.getId(),
                        c.getFirstName(),
                        c.getLastName(),
                        c.getDateOfBirth().toString(),
                        1.0f))
                .toList();

        return new SearchDTO.SearchResult(
                hits,
                result.total().hitCount(),
                (int) Math.ceil((double) result.total().hitCount() / req.size()),
                req.page(),
                req.size(),
                req.query(),
                took);
    }

    /** Prefix autocomplete — minimum 2 characters */
    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public List<String> suggest(String prefix, int limit) {
        if (prefix == null || prefix.length() < 2) return List.of();
        return Search.session(entityManager)
                .search(Customer.class)
                .select(f -> f.field("firstName", String.class))
                .where(f -> f.bool(b -> {
                    b.should(f.wildcard().field("firstName").matching(prefix.toLowerCase() + "*"));
                    b.should(f.wildcard().field("lastName").matching(prefix.toLowerCase() + "*"));
                }))
                .fetch(limit)
                .hits()
                .stream()
                .distinct()
                .sorted()
                .toList();
    }

    /** Rebuilds the search index from the database. Run after bulk imports. */
    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_customers:write')")
    public void reindexAll() throws InterruptedException {
        log.info("Reindexing customers...");
        Search.session(entityManager)
                .massIndexer(Customer.class)
                .threadsToLoadObjects(4)
                .startAndWait();
        log.info("Reindex complete");
    }
}
