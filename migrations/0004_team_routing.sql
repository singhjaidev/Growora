CREATE TABLE "routing_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"selected_user_id" text,
	"strategy" text NOT NULL,
	"policy_version" integer NOT NULL,
	"outcome" text NOT NULL,
	"reason" text NOT NULL,
	"explanation" jsonb NOT NULL,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routing_decision_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "member_routing_profile" (
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"eligible" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT false NOT NULL,
	"capacity" integer DEFAULT 10 NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"last_assigned_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_routing_profile_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id"),
	CONSTRAINT "routing_capacity_range" CHECK ("member_routing_profile"."capacity" between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "routing_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "routing_job_revision" UNIQUE("lead_id","revision"),
	CONSTRAINT "routing_job_tenant_id" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "routing_policy" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"strategy" text DEFAULT 'MANUAL' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"rules" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "assignment_origin" text DEFAULT 'UNASSIGNED' NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "routing_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "routing_state" text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "routing_decision" ADD CONSTRAINT "routing_decision_workspace_id_lead_id_lead_workspace_id_id_fk" FOREIGN KEY ("workspace_id","lead_id") REFERENCES "public"."lead"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_decision" ADD CONSTRAINT "routing_decision_workspace_id_job_id_routing_job_workspace_id_id_fk" FOREIGN KEY ("workspace_id","job_id") REFERENCES "public"."routing_job"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_routing_profile" ADD CONSTRAINT "member_routing_profile_workspace_id_user_id_workspace_membership_workspace_id_user_id_fk" FOREIGN KEY ("workspace_id","user_id") REFERENCES "public"."workspace_membership"("workspace_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_job" ADD CONSTRAINT "routing_job_workspace_id_lead_id_lead_workspace_id_id_fk" FOREIGN KEY ("workspace_id","lead_id") REFERENCES "public"."lead"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_policy" ADD CONSTRAINT "routing_policy_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routing_decision_workspace_id_created_at_index" ON "routing_decision" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "routing_decision_workspace_id_lead_id_created_at_index" ON "routing_decision" USING btree ("workspace_id","lead_id","created_at");--> statement-breakpoint
CREATE INDEX "routing_job_status_available_at_index" ON "routing_job" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "routing_job_lease_until_index" ON "routing_job" USING btree ("lease_until");--> statement-breakpoint
CREATE INDEX "lead_workspace_id_routing_state_created_at_index" ON "lead" USING btree ("workspace_id","routing_state","created_at");
--> statement-breakpoint
UPDATE lead SET assignment_origin='MANUAL' WHERE assigned_to_user_id IS NOT NULL;
