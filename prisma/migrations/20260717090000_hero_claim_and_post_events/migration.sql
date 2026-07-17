-- Hero linkage on posts
ALTER TABLE "Post" ADD COLUMN "isOwnStory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "heroEmail" TEXT;

-- Append-only post activity log
CREATE TABLE "PostEvent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostEvent_postId_type_idx" ON "PostEvent"("postId", "type");

ALTER TABLE "PostEvent" ADD CONSTRAINT "PostEvent_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
