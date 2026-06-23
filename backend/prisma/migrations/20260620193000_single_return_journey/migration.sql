-- A child may return after lunch or in the evening, but not in both rounds.
-- Keep the after-lunch selection when older records contain both choices.
DELETE FROM "TransportAssignment" evening
USING "TransportAssignment" afternoon
WHERE evening."childId" = afternoon."childId"
  AND evening."period" = 'EVENING'
  AND afternoon."period" = 'AFTERNOON';
