-- CONFIRMING: the customer has picked a slot and is reviewing it; the slot is held for everyone.
-- CONFIRMED: the customer confirmed the booking.
-- Existing appointments were already booked, so they are CONFIRMED.
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED';

-- Lets the (future) job that expires CONFIRMING holds find them quickly.
CREATE INDEX IF NOT EXISTS idx_appointments_status_created ON appointments (status, created_at);
