CREATE TABLE IF NOT EXISTS employee_services
(
    employee_id BIGINT NOT NULL,
    service_id  BIGINT NOT NULL,
    PRIMARY KEY (employee_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_services_service ON employee_services (service_id);
