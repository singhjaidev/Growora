CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_form_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text DEFAULT '' NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"consent_notice" text NOT NULL,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"assigned_to_user_id" text,
	"review_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_workspace_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "lead_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"before" text,
	"after" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"public_id" text NOT NULL,
	"name" text NOT NULL,
	"privacy_notice" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"retention_days" integer,
	"created_by" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_form_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "form_workspace_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "form_retention_valid" CHECK ("lead_form"."retention_days" is null or "lead_form"."retention_days" between 1 and 3650)
);
--> statement-breakpoint
CREATE TABLE "lead_receipt" (
	"form_id" uuid NOT NULL,
	"key" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_receipt_form_id_key_pk" PRIMARY KEY("form_id","key")
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_workspace_id_source_form_id_lead_form_workspace_id_id_fk" FOREIGN KEY ("workspace_id","source_form_id") REFERENCES "public"."lead_form"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_workspace_id_assigned_to_user_id_workspace_membership_workspace_id_user_id_fk" FOREIGN KEY ("workspace_id","assigned_to_user_id") REFERENCES "public"."workspace_membership"("workspace_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_workspace_id_lead_id_lead_workspace_id_id_fk" FOREIGN KEY ("workspace_id","lead_id") REFERENCES "public"."lead"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_form" ADD CONSTRAINT "lead_form_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_form" ADD CONSTRAINT "lead_form_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_receipt" ADD CONSTRAINT "lead_receipt_form_id_lead_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."lead_form"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_workspace_id_created_at_id_index" ON "lead" USING btree ("workspace_id","created_at","id");--> statement-breakpoint
CREATE INDEX "lead_workspace_id_status_created_at_index" ON "lead" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
CREATE INDEX "lead_workspace_id_assigned_to_user_id_created_at_index" ON "lead" USING btree ("workspace_id","assigned_to_user_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_source_form_id_index" ON "lead" USING btree ("source_form_id");--> statement-breakpoint
CREATE INDEX "lead_workspace_id_review_at_index" ON "lead" USING btree ("workspace_id","review_at");--> statement-breakpoint
CREATE INDEX "lead_activity_workspace_id_lead_id_created_at_id_index" ON "lead_activity" USING btree ("workspace_id","lead_id","created_at","id");--> statement-breakpoint
CREATE INDEX "lead_form_workspace_id_created_at_index" ON "lead_form" USING btree ("workspace_id","created_at");