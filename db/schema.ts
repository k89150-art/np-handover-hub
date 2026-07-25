import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 共用的 handover_type 由前端 HandoverType 與資料表 NOT NULL 欄位雙重約束。
// 兩種資料分表儲存，既有資料不可直接轉換類型。
export const handoverSessions = sqliteTable("handover_sessions", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").notNull(),
  handoverDate: text("handover_date").notNull(),
  shift: text("shift").notNull(),
  status: text("status").notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  acceptedBy: text("accepted_by"),
  acceptedAt: text("accepted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const newPatients = sqliteTable(
  "new_patients",
  {
    id: text("id").primaryKey(),
    handoverType: text("handover_type").notNull().default("new_patient"),
  sessionId: text("session_id").notNull(),
  unitId: text("unit_id").notNull(),
  handoverDate: text("handover_date").notNull(),
  shift: text("shift").notNull(),
  bedNo: text("bed_no").notNull(),
  patientAlias: text("patient_alias"),
  attendingDoctor: text("attending_doctor"),
  admissionDate: text("admission_date"),
  admissionSource: text("admission_source"),
  primaryDiagnosis: text("primary_diagnosis"),
  admissionReason: text("admission_reason"),
  importantHistory: text("important_history"),
  consciousness: text("consciousness"),
  respiratoryCirculation: text("respiratory_circulation"),
  lines: text("lines"),
  diet: text("diet"),
  activity: text("activity"),
  isolation: text("isolation"),
  importantTreatment: text("important_treatment"),
  pendingLabs: text("pending_labs"),
  pendingExams: text("pending_exams"),
  consultation: text("consultation"),
  familyCommunication: text("family_communication"),
  treatmentLimit: text("treatment_limit"),
  nightPrecautions: text("night_precautions"),
  reportConditions: text("report_conditions"),
  handoverBy: text("handover_by").notNull(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    check("new_patients_handover_type_check", sql`${table.handoverType} = 'new_patient'`),
  ],
);

export const troubleshootingItems = sqliteTable(
  "troubleshooting_items",
  {
    id: text("id").primaryKey(),
    handoverType: text("handover_type").notNull().default("troubleshooting"),
  sessionId: text("session_id").notNull(),
  unitId: text("unit_id").notNull(),
  patientReference: text("patient_reference"),
  handoverDate: text("handover_date").notNull(),
  shift: text("shift").notNull(),
  bedNo: text("bed_no").notNull(),
  patientAlias: text("patient_alias"),
  diagnosis: text("diagnosis"),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  specialSituation: text("special_situation").notNull(),
  completedAction: text("completed_action"),
  pendingFollowup: text("pending_followup"),
  followupAt: text("followup_at"),
  ownerId: text("owner_id"),
  status: text("status").notNull().default("pending"),
  handoverBy: text("handover_by").notNull(),
  acceptedBy: text("accepted_by"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    check(
      "troubleshooting_handover_type_check",
      sql`${table.handoverType} = 'troubleshooting'`,
    ),
  ],
);

export const troubleshootingUpdates = sqliteTable("troubleshooting_updates", {
  id: text("id").primaryKey(),
  troubleshootingId: text("troubleshooting_id").notNull(),
  unitId: text("unit_id").notNull(),
  updateType: text("update_type").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  unitId: text("unit_id"),
  userId: text("user_id").notNull(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id"),
  action: text("action").notNull(),
  oldData: text("old_data"),
  newData: text("new_data"),
  createdAt: text("created_at").notNull(),
});

export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  unitId: text("unit_id"),
  retentionDays: integer("retention_days").notNull().default(5),
  autoPurgeEnabled: integer("auto_purge_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  purgeTime: text("purge_time").notNull().default("03:00:00"),
  lastPurgeAt: text("last_purge_at"),
  lastPurgeStatus: text("last_purge_status"),
  updatedBy: text("updated_by"),
});

export const purgeRunLogs = sqliteTable("purge_run_logs", {
  id: text("id").primaryKey(),
  unitId: text("unit_id"),
  executedAt: text("executed_at").notNull(),
  cutoffDate: text("cutoff_date").notNull(),
  deletedSessionCount: integer("deleted_session_count").notNull().default(0),
  deletedNewPatientCount: integer("deleted_new_patient_count").notNull().default(0),
  deletedTroubleshootingCount: integer("deleted_troubleshooting_count")
    .notNull()
    .default(0),
  deletedUpdateCount: integer("deleted_update_count").notNull().default(0),
  result: text("result").notNull(),
  errorSummary: text("error_summary"),
});
