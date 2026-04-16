-- V1: Baseline schema
-- Never modify an applied migration — Flyway checksums each file.
-- Additive changes go in a new Vn__ file.

CREATE TABLE IF NOT EXISTS customers (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE         NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_customers         PRIMARY KEY (id),
    CONSTRAINT uq_customer_identity UNIQUE (first_name, last_name, date_of_birth)
);

CREATE INDEX IF NOT EXISTS idx_customers_last_name  ON customers (last_name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);
