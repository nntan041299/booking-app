CREATE TABLE IF NOT EXISTS employees
(
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       UNIQUE,
    full_name  VARCHAR(100) NOT NULL,
    bio        TEXT,
    avatar_url VARCHAR(255),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
