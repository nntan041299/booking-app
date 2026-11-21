CREATE TABLE IF NOT EXISTS resources
(
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    type        VARCHAR(20)  NOT NULL CHECK (type IN ('ROOM', 'EQUIPMENT')),
    description TEXT,
    image_url   VARCHAR(255),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100)
);

-- The services that can use a resource (many-to-many).
CREATE TABLE IF NOT EXISTS resource_services
(
    resource_id BIGINT NOT NULL,
    service_id  BIGINT NOT NULL,
    PRIMARY KEY (resource_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_services_service ON resource_services (service_id);
