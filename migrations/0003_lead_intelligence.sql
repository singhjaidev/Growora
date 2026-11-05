CREATE TABLE "lead_intelligence" (
	"lead_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"generation" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"score" integer,
	"priority" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intelligence_tenant_lead" UNIQUE("workspace_id","lead_id"),
	CONSTRAINT "intelligence_score_range" CHECK ("lead_intelligence"."score" between 0 and 100),
	CONSTRAINT "intelligence_status" CHECK ("lead_intelligence"."status" in ('PENDING','PROCESSING','COMPLETED','FAILED','UNAVAILABLE'))
);
--> statement-breakpoint
CREATE TABLE "lead_ai_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"generation" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"error_code" text,
	"result" jsonb,
	"model" text,
	"prompt_version" text,
	"schema_version" text,
	"scoring_version" text,
	"policy" text,
	"input_hash" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"cost_usd" text,
	"processed_at" timestamp with time zone,
	"review" text,
	"review_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_lead_generation" UNIQUE("lead_id","generation")
);
--> statement-breakpoint
CREATE TABLE "lead_ai_usage" (
	"day" date PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_intelligence" ADD CONSTRAINT "lead_intelligence_workspace_id_lead_id_lead_workspace_id_id_fk" FOREIGN KEY ("workspace_id","lead_id") REFERENCES "public"."lead"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_ai_job" ADD CONSTRAINT "lead_ai_job_reviewed_by_auth_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_ai_job" ADD CONSTRAINT "lead_ai_job_workspace_id_lead_id_lead_intelligence_workspace_id_lead_id_fk" FOREIGN KEY ("workspace_id","lead_id") REFERENCES "public"."lead_intelligence"("workspace_id","lead_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_intelligence_workspace_id_priority_score_index" ON "lead_intelligence" USING btree ("workspace_id","priority","score");--> statement-breakpoint
CREATE INDEX "lead_ai_job_status_available_at_index" ON "lead_ai_job" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "lead_ai_job_lease_until_index" ON "lead_ai_job" USING btree ("lease_until");