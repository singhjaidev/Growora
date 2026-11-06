CREATE TABLE "marketing_destination" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"workspace_id" uuid,
	"form_id" uuid,
	"connected_by" text,
	CONSTRAINT "marketing_singleton" CHECK ("marketing_destination"."id" = 1),
	CONSTRAINT "marketing_version" CHECK ("marketing_destination"."version" > 0),
	CONSTRAINT "marketing_destination_complete" CHECK (("marketing_destination"."workspace_id" is null and "marketing_destination"."form_id" is null and "marketing_destination"."connected_by" is null) or ("marketing_destination"."workspace_id" is not null and "marketing_destination"."form_id" is not null and "marketing_destination"."connected_by" is not null))
);
--> statement-breakpoint
ALTER TABLE "marketing_destination" ADD CONSTRAINT "marketing_destination_connected_by_auth_user_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_destination" ADD CONSTRAINT "marketing_destination_workspace_id_form_id_lead_form_workspace_id_id_fk" FOREIGN KEY ("workspace_id","form_id") REFERENCES "public"."lead_form"("workspace_id","id") ON DELETE restrict ON UPDATE no action;