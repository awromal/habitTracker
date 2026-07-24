-- Add username as nullable first, backfill existing rows from the email's
-- local part (deduplicated with a numeric suffix), then enforce NOT NULL.
ALTER TABLE "users" ADD COLUMN "username" TEXT;

WITH ranked AS (
    SELECT id,
           lower(split_part(email, '@', 1)) AS base,
           ROW_NUMBER() OVER (PARTITION BY lower(split_part(email, '@', 1)) ORDER BY "createdAt") AS rn
    FROM "users"
)
UPDATE "users" u
SET "username" = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || r.rn END
FROM ranked r
WHERE u.id = r.id;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
