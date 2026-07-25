PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_new_patients` (
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
	`version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "new_patients_handover_type_check" CHECK("__new_new_patients"."handover_type" = 'new_patient')
);
--> statement-breakpoint
INSERT INTO `__new_new_patients`("id", "handover_type", "session_id", "unit_id", "handover_date", "shift", "bed_no", "patient_alias", "attending_doctor", "admission_date", "admission_source", "primary_diagnosis", "admission_reason", "important_history", "consciousness", "respiratory_circulation", "lines", "diet", "activity", "isolation", "important_treatment", "pending_labs", "pending_exams", "consultation", "family_communication", "treatment_limit", "night_precautions", "report_conditions", "handover_by", "created_by", "updated_by", "created_at", "updated_at", "version") SELECT "id", "handover_type", "session_id", "unit_id", "handover_date", "shift", "bed_no", "patient_alias", "attending_doctor", "admission_date", "admission_source", "primary_diagnosis", "admission_reason", "important_history", "consciousness", "respiratory_circulation", "lines", "diet", "activity", "isolation", "important_treatment", "pending_labs", "pending_exams", "consultation", "family_communication", "treatment_limit", "night_precautions", "report_conditions", "handover_by", "created_by", "updated_by", "created_at", "updated_at", "version" FROM `new_patients`;--> statement-breakpoint
DROP TABLE `new_patients`;--> statement-breakpoint
ALTER TABLE `__new_new_patients` RENAME TO `new_patients`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_troubleshooting_items` (
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
	`version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "troubleshooting_handover_type_check" CHECK("__new_troubleshooting_items"."handover_type" = 'troubleshooting')
);
--> statement-breakpoint
INSERT INTO `__new_troubleshooting_items`("id", "handover_type", "session_id", "unit_id", "patient_reference", "handover_date", "shift", "bed_no", "patient_alias", "diagnosis", "category", "priority", "special_situation", "completed_action", "pending_followup", "followup_at", "owner_id", "status", "handover_by", "accepted_by", "created_by", "updated_by", "created_at", "updated_at", "completed_at", "version") SELECT "id", "handover_type", "session_id", "unit_id", "patient_reference", "handover_date", "shift", "bed_no", "patient_alias", "diagnosis", "category", "priority", "special_situation", "completed_action", "pending_followup", "followup_at", "owner_id", "status", "handover_by", "accepted_by", "created_by", "updated_by", "created_at", "updated_at", "completed_at", "version" FROM `troubleshooting_items`;--> statement-breakpoint
DROP TABLE `troubleshooting_items`;--> statement-breakpoint
ALTER TABLE `__new_troubleshooting_items` RENAME TO `troubleshooting_items`;