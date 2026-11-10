ALTER TYPE "public"."comment_status" ADD VALUE 'pending';--> statement-breakpoint
CREATE TABLE "comment_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text,
	"visitor_id" text,
	"label" text DEFAULT '' NOT NULL,
	"origin_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "visitor_id" text;--> statement-breakpoint
CREATE INDEX "comment_blocks_ip_idx" ON "comment_blocks" USING btree ("ip_hash");--> statement-breakpoint
CREATE INDEX "comment_blocks_visitor_idx" ON "comment_blocks" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "comments_visitor_idx" ON "comments" USING btree ("visitor_id");