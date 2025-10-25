ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp;

UPDATE "tasks" SET "updated_at" = COALESCE("updated_at", "created_at");

ALTER TABLE "tasks" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "tasks" ALTER COLUMN "updated_at" SET NOT NULL;
