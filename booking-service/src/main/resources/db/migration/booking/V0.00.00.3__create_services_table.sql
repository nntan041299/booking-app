CREATE TABLE IF NOT EXISTS services
(
    id               BIGSERIAL     PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL UNIQUE,
    description      TEXT,
    duration_minutes INT           NOT NULL CHECK (duration_minutes > 0),
    price            NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100)
);
