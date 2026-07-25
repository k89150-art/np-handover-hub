CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text,
	`user_id` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text,
	`action` text NOT NULL,
	`old_data` text,
	`new_data` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `handover_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`handover_date` text NOT NULL,
	`shift` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`accepted_by` text,
	`accepted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `new_patients` (
	`id` text PRIMARY KEY NOT NULL,
	`handover_type` text DEFAULT 'new_patient' NOT NULL,
	`session_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`handover_date` text NOT NULL,
	`shift` text NOT NULL,
	`bed_no` text NOT NULL,
	`patient_alias` text,
	`attending_doctor` text,
	`admission_date` text,
	`admission_source` text,
	`primary_diagnosis` text,
	`admission_reason` text,
	`important_history` text,
	`consciousness` text,
	`respiratory_circulation` text,
	`lines` text,
	`diet` text,
	`activity` text,
	`isolation` text,
	`important_treatment` text,
	`pending_labs` text,
	`pending_exams` text,
	`consultation` text,
	`family_communication` text,
	`treatment_limit` text,
	`night_precautions` text,
	`report_conditions` text,
	`handover_by` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purge_run_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text,
	`executed_at` text NOT NULL,
	`cutoff_date` text NOT NULL,
	`deleted_session_count` integer DEFAULT 0 NOT NULL,
	`deleted_new_patient_count` integer DEFAULT 0 NOT NULL,
	`deleted_troubleshooting_count` integer DEFAULT 0 NOT NULL,
	`deleted_update_count` integer DEFAULT 0 NOT NULL,
	`result` text NOT NULL,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text,
	`retention_days` integer DEFAULT 5 NOT NULL,
	`auto_purge_enabled` integer DEFAULT true NOT NULL,
	`purge_time` text DEFAULT '03:00:00' NOT NULL,
	`last_purge_at` text,
	`last_purge_status` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `troubleshooting_items` (
	`id` text PRIMARY KEY NOT NULL,
	`handover_type` text DEFAULT 'troubleshooting' NOT NULL,
	`session_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`patient_reference` text,
	`handover_date` text NOT NULL,
	`shift` text NOT NULL,
	`bed_no` text NOT NULL,
	`patient_alias` text,
	`diagnosis` text,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`special_situation` text NOT NULL,
	`completed_action` text,
	`pending_followup` text,
	`followup_at` text,
	`owner_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`handover_by` text NOT NULL,
	`accepted_by` text,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `troubleshooting_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`troubleshooting_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`update_type` text NOT NULL,
	`content` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
