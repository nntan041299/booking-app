-- Appointment statuses now follow payment:
--   WAITING_PAYMENT: booked, not paid yet; the slot is held for everyone (was CONFIRMING).
--   PAID:            the customer paid (was CONFIRMED).
--   EXPIRED:         not paid in time; the slot is free again (a job sets this).
UPDATE appointments SET status = 'WAITING_PAYMENT' WHERE status = 'CONFIRMING';
UPDATE appointments SET status = 'EXPIRED' WHERE status = 'EXPIRED_CONFIRM';
-- Bookings that were already confirmed count as paid.
UPDATE appointments SET status = 'PAID', is_paid = TRUE, paid_at = COALESCE(paid_at, updated_at)
WHERE status = 'CONFIRMED';

ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'WAITING_PAYMENT';
