-- V3: Dev seed data
-- Loaded only when flyway.locations includes classpath:db/migration/dev
-- (see application-dev.yml). Never runs in staging or prod.

INSERT INTO customers (first_name, last_name, date_of_birth, email, status, created_at, updated_at) VALUES
    ('Alice',   'Smith',   '1985-03-10', 'alice.smith@example.com',   'ACTIVE',    NOW(), NOW()),
    ('Bob',     'Jones',   '1990-07-22', 'bob.jones@example.com',     'ACTIVE',    NOW(), NOW()),
    ('Carol',   'White',   '1978-11-05', 'carol.white@example.com',   'INACTIVE',  NOW(), NOW()),
    ('David',   'Brown',   '1995-01-30', 'david.brown@example.com',   'ACTIVE',    NOW(), NOW()),
    ('Eve',     'Taylor',  '1988-06-15', 'eve.taylor@example.com',    'ACTIVE',    NOW(), NOW()),
    ('Frank',   'Wilson',  '1973-09-20', 'frank.wilson@example.com',  'SUSPENDED', NOW(), NOW()),
    ('Grace',   'Adams',   '1992-12-01', 'grace.adams@example.com',   'ACTIVE',    NOW(), NOW()),
    ('Henry',   'Thomas',  '1980-04-18', 'henry.thomas@example.com',  'ACTIVE',    NOW(), NOW());
