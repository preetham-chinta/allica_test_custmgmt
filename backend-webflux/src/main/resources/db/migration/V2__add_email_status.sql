-- V2: Add email, status, updated_at for V2 API response
-- Additive only — no columns removed, no columns renamed.
-- V1 API continues to work unchanged after this migration.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email      VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE customers SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE customers
    ADD CONSTRAINT IF NOT EXISTS chk_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
