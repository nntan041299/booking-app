CREATE TABLE IF NOT EXISTS employee_working_hours
(
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT    NOT NULL,
    day_of_week SMALLINT  NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- ISO, 1 = Monday
    start_time  TIME      NOT NULL,
    end_time    TIME      NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_working_hours_employee_day ON employee_working_hours (employee_id, day_of_week);
