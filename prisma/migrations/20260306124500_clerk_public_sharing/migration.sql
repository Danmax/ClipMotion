ALTER TABLE "users" ADD COLUMN "clerkUserId" TEXT;
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

ALTER TABLE "projects" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "projects_isPublic_idx" ON "projects"("isPublic");

ALTER TABLE "characters" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "characters_isPublic_idx" ON "characters"("isPublic");
