-- An appointment keeps what the service was when it was booked (name and duration; the price
-- was already a snapshot), so later edits to the service do not change past bookings.
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS service_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Existing bookings: the name comes from the service as it is today (the best that is known), the
-- duration from the booked time range, which was fixed when the booking was made.
UPDATE appointments a
SET service_name = s.name
FROM services s
WHERE a.service_id = s.id
  AND a.service_name IS NULL;

UPDATE appointments
SET service_name = 'Unknown service'
WHERE service_name IS NULL;

UPDATE appointments
SET duration_minutes = (EXTRACT(EPOCH FROM (end_at - start_at)) / 60)::INTEGER
WHERE duration_minutes IS NULL;

ALTER TABLE appointments
    ALTER COLUMN service_name SET NOT NULL,
    ALTER COLUMN duration_minutes SET NOT NULL,
    ADD CONSTRAINT chk_appointments_duration_positive CHECK (duration_minutes > 0);
