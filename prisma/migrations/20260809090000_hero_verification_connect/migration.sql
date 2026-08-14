CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_CLAIM', 'VERIFIED');
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "Post" ADD COLUMN "heroProfileId" TEXT;
ALTER TABLE "Post" ADD COLUMN "flagged" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "HeroProfile" (
    "id" TEXT NOT NULL,
    "heroName" TEXT NOT NULL,
    "bio" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "stripeAccountId" TEXT,
    "contactEmail" TEXT,
    "claimedByUserId" TEXT,
    "stripeIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "payoutsFrozen" BOOLEAN NOT NULL DEFAULT false,
    "externalProofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HeroProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeroClaimToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "heroProfileId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeroClaimToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "heroProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationEvidence" (
    "id" TEXT NOT NULL,
    "heroProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HeroProfile_stripeAccountId_key" ON "HeroProfile"("stripeAccountId");
CREATE INDEX "HeroProfile_verificationStatus_idx" ON "HeroProfile"("verificationStatus");
CREATE INDEX "HeroProfile_claimedByUserId_idx" ON "HeroProfile"("claimedByUserId");
CREATE UNIQUE INDEX "HeroClaimToken_token_key" ON "HeroClaimToken"("token");
CREATE INDEX "HeroClaimToken_heroProfileId_used_idx" ON "HeroClaimToken"("heroProfileId", "used");
CREATE INDEX "HeroClaimToken_email_idx" ON "HeroClaimToken"("email");
CREATE INDEX "VerificationEvent_heroProfileId_createdAt_idx" ON "VerificationEvent"("heroProfileId", "createdAt");
CREATE INDEX "VerificationEvidence_heroProfileId_createdAt_idx" ON "VerificationEvidence"("heroProfileId", "createdAt");
CREATE INDEX "Post_heroProfileId_idx" ON "Post"("heroProfileId");

ALTER TABLE "Post" ADD CONSTRAINT "Post_heroProfileId_fkey" FOREIGN KEY ("heroProfileId") REFERENCES "HeroProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HeroProfile" ADD CONSTRAINT "HeroProfile_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HeroClaimToken" ADD CONSTRAINT "HeroClaimToken_heroProfileId_fkey" FOREIGN KEY ("heroProfileId") REFERENCES "HeroProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_heroProfileId_fkey" FOREIGN KEY ("heroProfileId") REFERENCES "HeroProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_heroProfileId_fkey" FOREIGN KEY ("heroProfileId") REFERENCES "HeroProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one canonical profile per existing story.
INSERT INTO "HeroProfile" ("id", "heroName", "contactEmail", "claimedByUserId", "createdAt", "updatedAt")
SELECT 'hp_' || "id", "name", "heroEmail", CASE WHEN "isOwnStory" THEN "authorId" ELSE NULL END, "createdAt", CURRENT_TIMESTAMP
FROM "Post";

UPDATE "Post" SET "heroProfileId" = 'hp_' || "id";
