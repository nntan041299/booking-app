CREATE TABLE IF NOT EXISTS appointments
(
    id          BIGSERIAL     PRIMARY KEY,
    customer_id BIGINT        NOT NULL,
    employee_id BIGINT        NOT NULL,
    service_id  BIGINT        NOT NULL,
    start_at    TIMESTAMP     NOT NULL,
    end_at      TIMESTAMP     NOT NULL, -- start_at + service duration
    price       NUMERIC(10,2) NOT NULL, -- snapshot of service price at booking time
    is_paid     BOOLEAN       NOT NULL DEFAULT FALSE,
    paid_at     TIMESTAMP,
    note        TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    CHECK (start_at < end_at),
    CHECK (is_paid = (paid_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_appointments_employee_start ON appointments (employee_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_start ON appointments (customer_id, start_at);
