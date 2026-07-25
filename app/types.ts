export type HandoverType = "new_patient" | "troubleshooting";

export type Shift = "白班" | "小夜班" | "大夜班";
export type Priority = "high" | "medium" | "low";
export type TroubleshootingStatus =
  | "pending"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export interface NewPatient {
  id: string;
  handover_type: "new_patient";
  handoverDate: string;
  shift: Shift;
  unit: string;
  bedNo: string;
  patientAlias: string;
  attendingDoctor: string;
  admissionDate: string;
  admissionSource: string;
  primaryDiagnosis: string;
  admissionReason: string;
  importantHistory: string;
  consciousness: string;
  respiratoryCirculation: string;
  lines: string;
  diet: string;
  activity: string;
  isolation: string;
  importantTreatment: string;
  pendingLabs: string;
  pendingExams: string;
  consultation: string;
  familyCommunication: string;
  treatmentLimit: string;
  nightPrecautions: string;
  reportConditions: string;
  handoverBy: string;
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineUpdate {
  id: string;
  time: string;
  author: string;
  content: string;
}

export interface TroubleshootingItem {
  id: string;
  handover_type: "troubleshooting";
  patientReference?: string;
  handoverDate: string;
  shift: Shift;
  unit: string;
  bedNo: string;
  patientAlias: string;
  diagnosis: string;
  category: string;
  priority: Priority;
  specialSituation: string;
  completedAction: string;
  pendingFollowup: string;
  followupAt: string;
  ownerName: string;
  status: TroubleshootingStatus;
  timelineUpdates: TimelineUpdate[];
  handoverBy: string;
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PrintType = "new_patient" | "troubleshooting" | "all";

export interface PrintSettings {
  type: PrintType;
  date: string;
  shift: Shift | "全部班別";
  unit: string;
  includeCompleted: boolean;
  includeCancelled: boolean;
  includeBlankRows: boolean;
  blankRowCount: number;
  showMetadata: boolean;
  skipEmptySheets: boolean;
}

export interface PurgeStats {
  newPatients: number;
  troubleshooting: number;
  updates: number;
  sessions: number;
}
