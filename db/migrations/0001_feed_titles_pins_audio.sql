ALTER TYPE "public"."media_kind" ADD VALUE 'audio';--> statement-breakpoint
ALTER TABLE "feed_posts" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;