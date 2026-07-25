"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { UserProfile, useFirebaseSession } from "./FirebaseProvider";
import { NewPatientPrintSheet } from "./NewPatientPrintSheet";
import { TroubleshootingPrintSheet } from "./TroubleshootingPrintSheet";
import { firestore } from "./firebase";
import type {
  HandoverType,
  NewPatient,
  PrintSettings,
  PurgeStats,
  Shift,
  TroubleshootingItem,
  TroubleshootingStatus,
} from "./types";

type View =
  | "overview"
  | "new_patients"
  | "troubleshooting"
  | "print"
  | "admin";

const TODAY = "2026-07-25";
const UNIT = "胸腔內科病房";
const UNIT_ID = "chest-medicine";

const seedPatients: NewPatient[] = [
  {
    id: "np-1",
    handover_type: "new_patient",
    handoverDate: TODAY,
    shift: "大夜班",
    unitId: UNIT_ID,
    unit: UNIT,
    bedNo: "1208-1",
    patientAlias: "林先生",
    attendingDoctor: "陳醫師",
    admissionDate: "2026-07-25",
    admissionSource: "急診",
    primaryDiagnosis: "社區型肺炎併低血氧",
    admissionReason: "發燒、呼吸喘三日，SpO₂ 88%",
    importantHistory: "COPD、第二型糖尿病",
    consciousness: "GCS E4V5M6，清楚",
    respiratoryCirculation: "O₂ nasal cannula 3 L/min，SpO₂ 94%；BP 128/76",
    lines: "右手 PIV；Foley",
    diet: "糖尿病飲食",
    activity: "床邊活動，需一人協助",
    isolation: "飛沫隔離",
    importantTreatment: "Ceftriaxone 2 g QD；Azithromycin 500 mg QD；霧化治療",
    pendingLabs: "06:00 CBC、CRP",
    pendingExams: "明早追蹤 CXR",
    consultation: "",
    familyCommunication: "女兒已了解目前病況與治療計畫",
    treatmentLimit: "Full code",
    nightPrecautions: "注意呼吸窘迫與血氧下降",
    reportConditions: "SpO₂ < 90% 或 RR > 28 立即回報",
    handoverBy: "王怡婷 NP",
    acceptedBy: "",
    createdAt: "2026-07-25T00:35:00",
    updatedAt: "2026-07-25T02:10:00",
  },
  {
    id: "np-2",
    handover_type: "new_patient",
    handoverDate: TODAY,
    shift: "大夜班",
    unitId: UNIT_ID,
    unit: UNIT,
    bedNo: "1215-2",
    patientAlias: "張女士",
    attendingDoctor: "黃醫師",
    admissionDate: "2026-07-24",
    admissionSource: "門診",
    primaryDiagnosis: "右側胸腔積液",
    admissionReason: "活動後喘，影像顯示大量胸水",
    importantHistory: "乳癌治療中",
    consciousness: "清楚",
    respiratoryCirculation: "室內空氣 SpO₂ 95%，生命徵象穩定",
    lines: "左手 PIV",
    diet: "一般飲食，午夜後 NPO",
    activity: "可自行下床",
    isolation: "無",
    importantTreatment: "明日超音波導引胸腔穿刺",
    pendingLabs: "PT/APTT",
    pendingExams: "胸腔超音波",
    consultation: "胸腔科已照會",
    familyCommunication: "已說明穿刺流程",
    treatmentLimit: "",
    nightPrecautions: "觀察呼吸與胸痛",
    reportConditions: "突發呼吸困難或血壓下降",
    handoverBy: "王怡婷 NP",
    acceptedBy: "",
    createdAt: "2026-07-24T22:10:00",
    updatedAt: "2026-07-25T01:30:00",
  },
];

const seedTroubles: TroubleshootingItem[] = [
  {
    id: "ts-1",
    handover_type: "troubleshooting",
    patientReference: "np-1",
    handoverDate: TODAY,
    shift: "大夜班",
    unitId: UNIT_ID,
    unit: UNIT,
    bedNo: "1208-1",
    patientAlias: "林先生",
    diagnosis: "社區型肺炎",
    category: "呼吸",
    priority: "high",
    specialSituation: "凌晨血氧下降至 88%，呼吸費力。",
    completedAction: "氧氣調升至 simple mask 6 L/min，完成 ABG，已通知值班醫師。",
    pendingFollowup: "追蹤血氧與 ABG 結果；評估是否需 HFNC。",
    followupAt: "2026-07-25T04:30",
    ownerName: "值班 NP",
    status: "in_progress",
    timelineUpdates: [
      { id: "u-1", time: "03:20", author: "王 NP", content: "SpO₂ 回升至 94%" },
      { id: "u-2", time: "03:45", author: "李醫師", content: "維持目前氧療並密切觀察" },
    ],
    handoverBy: "王怡婷 NP",
    acceptedBy: "",
    createdAt: "2026-07-25T03:05:00",
    updatedAt: "2026-07-25T03:45:00",
  },
  {
    id: "ts-2",
    handover_type: "troubleshooting",
    handoverDate: TODAY,
    shift: "大夜班",
    unitId: UNIT_ID,
    unit: UNIT,
    bedNo: "1123-2",
    patientAlias: "陳先生",
    diagnosis: "敗血症",
    category: "檢驗",
    priority: "medium",
    specialSituation: "血液培養 GNB，感染科建議調整抗生素。",
    completedAction: "已抽 trough level 並確認腎功能。",
    pendingFollowup: "06:00 追蹤藥敏與感染科正式建議。",
    followupAt: "2026-07-25T06:00",
    ownerName: "周 NP",
    status: "waiting",
    timelineUpdates: [
      { id: "u-3", time: "01:10", author: "周 NP", content: "感染科口頭回覆已記錄" },
    ],
    handoverBy: "周雅雯 NP",
    acceptedBy: "",
    createdAt: "2026-07-25T00:50:00",
    updatedAt: "2026-07-25T01:10:00",
  },
  {
    id: "ts-3",
    handover_type: "troubleshooting",
    handoverDate: TODAY,
    shift: "大夜班",
    unitId: UNIT_ID,
    unit: UNIT,
    bedNo: "1106-1",
    patientAlias: "吳女士",
    diagnosis: "心衰竭",
    category: "用藥",
    priority: "low",
    specialSituation: "利尿劑調整後需追蹤尿量。",
    completedAction: "本班尿量 850 mL，體重下降 0.6 kg。",
    pendingFollowup: "白班再評估輸出入量。",
    followupAt: "2026-07-25T08:00",
    ownerName: "白班 NP",
    status: "completed",
    timelineUpdates: [],
    handoverBy: "周雅雯 NP",
    acceptedBy: "陳思妤 NP",
    createdAt: "2026-07-24T20:15:00",
    updatedAt: "2026-07-25T05:20:00",
  },
];

const emptyPatient = (): NewPatient => ({
  id: "",
  handover_type: "new_patient",
  handoverDate: TODAY,
  shift: "大夜班",
  unitId: UNIT_ID,
  unit: UNIT,
  bedNo: "",
  patientAlias: "",
  attendingDoctor: "",
  admissionDate: TODAY,
  admissionSource: "",
  primaryDiagnosis: "",
  admissionReason: "",
  importantHistory: "",
  consciousness: "",
  respiratoryCirculation: "",
  lines: "",
  diet: "",
  activity: "",
  isolation: "",
  importantTreatment: "",
  pendingLabs: "",
  pendingExams: "",
  consultation: "",
  familyCommunication: "",
  treatmentLimit: "",
  nightPrecautions: "",
  reportConditions: "",
  handoverBy: "目前使用者",
  acceptedBy: "",
  createdAt: "",
  updatedAt: "",
});

const emptyTrouble = (): TroubleshootingItem => ({
  id: "",
  handover_type: "troubleshooting",
  handoverDate: TODAY,
  shift: "大夜班",
  unitId: UNIT_ID,
  unit: UNIT,
  bedNo: "",
  patientAlias: "",
  diagnosis: "",
  category: "病況變化",
  priority: "medium",
  specialSituation: "",
  completedAction: "",
  pendingFollowup: "",
  followupAt: "",
  ownerName: "",
  status: "pending",
  timelineUpdates: [],
  handoverBy: "目前使用者",
  acceptedBy: "",
  createdAt: "",
  updatedAt: "",
});

const statusText: Record<TroubleshootingStatus, string> = {
  pending: "待處理",
  in_progress: "處理中",
  waiting: "待追蹤",
  completed: "已完成",
  cancelled: "已取消",
};

function Icon({ name }: { name: string }) {
  const glyphs: Record<string, string> = {
    overview: "⌂",
    patient: "＋",
    trouble: "!",
    print: "▤",
    admin: "⚙",
    bell: "●",
    search: "⌕",
    calendar: "◫",
    chevron: "›",
    close: "×",
    check: "✓",
    clock: "◷",
    shield: "◇",
  };
  return <span className="icon" aria-hidden="true">{glyphs[name] ?? "•"}</span>;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  options,
  span = 1,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date" | "datetime-local" | "textarea";
  placeholder?: string;
  options?: string[];
  span?: 1 | 2 | 3;
}) {
  return (
    <label className={`field span-${span}`}>
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function StatCard({
  label,
  value,
  tone,
  note,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  note: string;
  icon: string;
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><Icon name={icon} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function HandoverApp() {
  const { user, profile, logout } = useFirebaseSession();
  const [view, setView] = useState<View>("overview");
  const [patients, setPatients] = useState<NewPatient[]>([]);
  const [troubles, setTroubles] = useState<TroubleshootingItem[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift>("大夜班");
  const seedAttempted = useRef(false);
  const [modal, setModal] = useState<"type" | HandoverType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conditionTarget, setConditionTarget] =
    useState<TroubleshootingItem | null>(null);
  const [conditionText, setConditionText] = useState("");
  const [patientForm, setPatientForm] = useState<NewPatient>(emptyPatient);
  const [troubleForm, setTroubleForm] = useState<TroubleshootingItem>(emptyTrouble);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [retentionDays, setRetentionDays] = useState(5);
  const [purgeStats, setPurgeStats] = useState<PurgeStats>({
    newPatients: 2,
    troubleshooting: 1,
    updates: 4,
    sessions: 1,
  });
  const [lastPurge, setLastPurge] = useState("2026/07/25 03:00");
  const [settings, setSettings] = useState<PrintSettings>({
    type: "all",
    date: TODAY,
    shift: "大夜班",
    unit: UNIT,
    includeCompleted: false,
    includeCancelled: false,
    includeBlankRows: true,
    blankRowCount: 2,
    showMetadata: false,
    skipEmptySheets: false,
  });

  useEffect(() => {
    if (!profile || !user) return;

    const patientQuery = query(
      collection(firestore, "new_patients"),
      where("unitId", "==", profile.unitId),
    );
    const troubleQuery = query(
      collection(firestore, "troubleshooting_items"),
      where("unitId", "==", profile.unitId),
    );

    const stopPatients = onSnapshot(
      patientQuery,
      (snapshot) => {
        const nextPatients = snapshot.docs
          .map((item) => item.data() as NewPatient)
          .filter((item) => item.handover_type === "new_patient")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPatients(nextPatients);
        setDataLoading(false);

        if (
          snapshot.empty &&
          profile.role === "admin" &&
          !seedAttempted.current
        ) {
          seedAttempted.current = true;
          const batch = writeBatch(firestore);
          seedPatients.forEach((patient) => {
            batch.set(doc(firestore, "new_patients", patient.id), {
              ...patient,
              unitId: profile.unitId,
              unit: profile.unitName,
              createdBy: user.uid,
              updatedBy: user.uid,
            });
          });
          seedTroubles.forEach((item) => {
            batch.set(doc(firestore, "troubleshooting_items", item.id), {
              ...item,
              unitId: profile.unitId,
              unit: profile.unitName,
              createdBy: user.uid,
              updatedBy: user.uid,
            });
          });
          void batch.commit().catch(() => {
            setToast("展示資料初始化失敗，請檢查 Firestore 權限");
          });
        }
      },
      () => {
        setDataLoading(false);
        setToast("無法同步新病人資料，請檢查網路或權限");
      },
    );

    const stopTroubles = onSnapshot(
      troubleQuery,
      (snapshot) => {
        setTroubles(
          snapshot.docs
            .map((item) => item.data() as TroubleshootingItem)
            .filter((item) => item.handover_type === "troubleshooting")
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
      },
      () => setToast("無法同步 Trouble shooting 資料"),
    );

    return () => {
      stopPatients();
      stopTroubles();
    };
  }, [profile, user]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    return onSnapshot(collection(firestore, "profiles"), (snapshot) => {
      setProfiles(snapshot.docs.map((item) => item.data() as UserProfile));
    });
  }, [profile?.role]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visiblePatients = useMemo(
    () =>
      patients.filter(
        (item) => item.handoverDate === TODAY && item.shift === activeShift,
      ),
    [activeShift, patients],
  );
  const visibleTroubles = useMemo(
    () =>
      troubles.filter(
        (item) => item.handoverDate === TODAY && item.shift === activeShift,
      ),
    [activeShift, troubles],
  );

  const pendingCount = visibleTroubles.filter(
    (item) => !["completed", "cancelled"].includes(item.status),
  ).length;
  const highCount = visibleTroubles.filter(
    (item) => item.priority === "high" && item.status !== "completed",
  ).length;
  const completedCount = visibleTroubles.filter(
    (item) => item.status === "completed",
  ).length;

  const printPatients = useMemo(
    () =>
      patients.filter(
        (item) =>
          item.handover_type === "new_patient" &&
          item.handoverDate === settings.date &&
          (settings.shift === "全部班別" || item.shift === settings.shift) &&
          item.unit === settings.unit,
      ),
    [patients, settings],
  );

  const printTroubles = useMemo(
    () =>
      troubles.filter(
        (item) =>
          item.handover_type === "troubleshooting" &&
          item.handoverDate === settings.date &&
          (settings.shift === "全部班別" || item.shift === settings.shift) &&
          item.unit === settings.unit &&
          (settings.includeCompleted || item.status !== "completed") &&
          (settings.includeCancelled || item.status !== "cancelled"),
      ),
    [troubles, settings],
  );

  function chooseType(type: HandoverType) {
    setFormError("");
    setEditingId(null);
    if (type === "new_patient") {
      setPatientForm({
        ...emptyPatient(),
        handoverBy: profile?.displayName ?? "目前使用者",
      });
    } else {
      setTroubleForm({
        ...emptyTrouble(),
        handoverBy: profile?.displayName ?? "目前使用者",
      });
    }
    setModal(type);
  }

  function editPatient(patient: NewPatient) {
    setFormError("");
    setEditingId(patient.id);
    setPatientForm({ ...patient });
    setModal("new_patient");
  }

  function editTrouble(item: TroubleshootingItem) {
    setFormError("");
    setEditingId(item.id);
    setTroubleForm({ ...item });
    setModal("troubleshooting");
  }

  async function savePatient(event: FormEvent) {
    event.preventDefault();
    if (patientForm.handover_type !== "new_patient") {
      setFormError("資料類型驗證失敗，無法儲存。");
      return;
    }
    if (
      !patientForm.handoverDate ||
      !patientForm.shift ||
      !patientForm.bedNo.trim() ||
      (!patientForm.primaryDiagnosis.trim() && !patientForm.admissionReason.trim())
    ) {
      setFormError("請完成日期、班別、床號，以及主要診斷或入院原因。");
      return;
    }
    if (!user || !profile) return;
    const now = new Date().toISOString().slice(0, 19);
    const id = editingId ?? `np-${Date.now()}`;
    try {
      const payload = {
        ...patientForm,
        id,
        unitId: profile.unitId,
        unit: profile.unitName,
        createdBy: editingId ? patientForm.createdBy : user.uid,
        updatedBy: user.uid,
        createdAt: editingId ? patientForm.createdAt : now,
        updatedAt: now,
      };
      if (editingId) {
        await updateDoc(doc(firestore, "new_patients", id), payload);
      } else {
        await setDoc(doc(firestore, "new_patients", id), payload);
      }
      setModal(null);
      setEditingId(null);
      setView("new_patients");
      setToast(editingId ? "新病人交班資料已更新" : "新病人交班已建立，所有已登入使用者將即時同步");
    } catch {
      setFormError("儲存失敗，請檢查網路連線或帳號權限。");
    }
  }

  async function saveTrouble(event: FormEvent) {
    event.preventDefault();
    if (troubleForm.handover_type !== "troubleshooting") {
      setFormError("資料類型驗證失敗，無法儲存。");
      return;
    }
    if (
      !troubleForm.handoverDate ||
      !troubleForm.shift ||
      !troubleForm.bedNo.trim() ||
      !troubleForm.specialSituation.trim()
    ) {
      setFormError("請完成日期、班別、床號與特殊情況。");
      return;
    }
    if (!user || !profile) return;
    const now = new Date().toISOString().slice(0, 19);
    const id = editingId ?? `ts-${Date.now()}`;
    try {
      const payload = {
        ...troubleForm,
        id,
        unitId: profile.unitId,
        unit: profile.unitName,
        createdBy: editingId ? troubleForm.createdBy : user.uid,
        updatedBy: user.uid,
        createdAt: editingId ? troubleForm.createdAt : now,
        updatedAt: now,
      };
      if (editingId) {
        await updateDoc(doc(firestore, "troubleshooting_items", id), payload);
      } else {
        await setDoc(doc(firestore, "troubleshooting_items", id), payload);
      }
      setModal(null);
      setEditingId(null);
      setView("troubleshooting");
      setToast(editingId ? "Trouble shooting 資料已更新" : "Trouble shooting 已建立，所有已登入使用者將即時同步");
    } catch {
      setFormError("儲存失敗，請檢查網路連線或帳號權限。");
    }
  }

  function canDelete(createdBy?: string) {
    return Boolean(
      user && (createdBy === user.uid || profile?.role === "admin"),
    );
  }

  async function removeRecord(
    type: HandoverType,
    id: string,
    createdBy?: string,
  ) {
    if (!canDelete(createdBy)) {
      setToast("只有資料建立者可以刪除此資料");
      return;
    }
    if (!window.confirm("確定要永久刪除這筆交班資料嗎？此動作無法復原。")) {
      return;
    }
    try {
      await deleteDoc(
        doc(
          firestore,
          type === "new_patient"
            ? "new_patients"
            : "troubleshooting_items",
          id,
        ),
      );
      setToast("交班資料已刪除");
    } catch {
      setToast("刪除失敗，只有建立者或管理者可以刪除");
    }
  }

  async function updateTroubleStatus(
    item: TroubleshootingItem,
    status: TroubleshootingStatus,
  ) {
    if (!user) return;
    try {
      await updateDoc(doc(firestore, "troubleshooting_items", item.id), {
        status,
        updatedBy: user.uid,
        updatedAt: new Date().toISOString().slice(0, 19),
      });
      setToast(`狀態已更新為「${statusText[status]}」`);
    } catch {
      setToast("狀態更新失敗，請檢查帳號權限");
    }
  }

  function openConditionUpdate(item: TroubleshootingItem) {
    setConditionTarget(item);
    setConditionText("");
  }

  async function saveConditionUpdate(event: FormEvent) {
    event.preventDefault();
    if (!conditionTarget || !user || !profile || !conditionText.trim()) return;
    const now = new Date();
    const timelineUpdate = {
      id: `update-${Date.now()}`,
      time: now.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      author: profile.displayName,
      content: conditionText.trim(),
    };
    try {
      await updateDoc(
        doc(firestore, "troubleshooting_items", conditionTarget.id),
        {
          timelineUpdates: arrayUnion(timelineUpdate),
          updatedBy: user.uid,
          updatedAt: now.toISOString().slice(0, 19),
        },
      );
      setConditionTarget(null);
      setConditionText("");
      setToast("目前病況已加入時間軸");
    } catch {
      setToast("病況更新失敗，請檢查帳號權限");
    }
  }

  function openPrint(type: PrintSettings["type"], shouldPrint = false) {
    setSettings((current) => ({ ...current, type }));
    setView("print");
    if (shouldPrint) {
      window.setTimeout(() => window.print(), 160);
    }
  }

  async function runPurge() {
    const cutoff = new Date(`${TODAY}T00:00:00`);
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const oldPatients = patients.filter(
      (item) => new Date(item.handoverDate) < cutoff,
    );
    const oldTroubles = troubles.filter(
      (item) => new Date(item.handoverDate) < cutoff,
    );
    const stats = {
      newPatients: oldPatients.length,
      troubleshooting: oldTroubles.length,
      updates: oldTroubles.reduce((sum, item) => sum + item.timelineUpdates.length, 0),
      sessions: oldPatients.length || oldTroubles.length ? 1 : 0,
    };
    if (!user || profile?.role !== "admin") return;
    try {
      const batch = writeBatch(firestore);
      oldPatients.forEach((item) =>
        batch.delete(doc(firestore, "new_patients", item.id)),
      );
      oldTroubles.forEach((item) =>
        batch.delete(doc(firestore, "troubleshooting_items", item.id)),
      );
      const logId = `purge-${Date.now()}`;
      batch.set(doc(firestore, "purge_run_logs", logId), {
        id: logId,
        unitId: profile.unitId,
        executedAt: serverTimestamp(),
        cutoffDate: cutoff.toISOString().slice(0, 10),
        deletedNewPatientCount: stats.newPatients,
        deletedTroubleshootingCount: stats.troubleshooting,
        deletedUpdateCount: stats.updates,
        deletedSessionCount: stats.sessions,
        executedBy: user.uid,
        result: "success",
      });
      await batch.commit();
      setPurgeStats(stats);
      setLastPurge("剛剛");
      setToast(
        stats.newPatients + stats.troubleshooting > 0
          ? "已永久清除超過保存期限的交班資料"
          : "清理完成，目前沒有超過保存期限的資料",
      );
    } catch {
      setToast("清理失敗，未刪除任何資料");
    }
  }

  async function updateProfileAccess(
    target: UserProfile,
    status: UserProfile["status"],
    role: UserProfile["role"] = target.role,
  ) {
    try {
      await updateDoc(doc(firestore, "profiles", target.uid), {
        status,
        role,
        unitId: profile?.unitId ?? UNIT_ID,
        unitName: profile?.unitName ?? UNIT,
        updatedAt: serverTimestamp(),
        approvedBy: user?.uid ?? "",
      });
      setToast(status === "active" ? "帳號已核准" : "帳號狀態已更新");
    } catch {
      setToast("帳號權限更新失敗");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">NP</div>
          <div>
            <strong>交班中樞</strong>
            <span>專科護理師多人交班</span>
          </div>
        </div>
        <nav aria-label="主要導覽">
          {([
            ["overview", "overview", "交班總覽"],
            ["new_patients", "patient", "新病人"],
            ["troubleshooting", "trouble", "Trouble shooting"],
            ["print", "print", "列印"],
            ...(profile?.role === "admin"
              ? ([["admin", "admin", "管理"]] as Array<[View, string, string]>)
              : []),
          ] as Array<[View, string, string]>).map(([key, icon, label]) => (
            <button
              className={view === key ? "active" : ""}
              key={key}
              onClick={() => setView(key)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {key === "troubleshooting" && pendingCount > 0 && (
                <b className="nav-count">{pendingCount}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>即時同步中</strong>
            <small>最後更新 09:18</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              {UNIT} <Icon name="chevron" /> 2026 年 7 月 25 日
            </div>
            <h1>
              {view === "overview" && "交班總覽"}
              {view === "new_patients" && "新病人"}
              {view === "troubleshooting" && "Trouble shooting"}
              {view === "print" && "列印與預覽"}
              {view === "admin" && "系統管理"}
            </h1>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Icon name="search" />
              <input aria-label="搜尋床號或病人代稱" placeholder="搜尋床號或病人代稱" />
            </label>
            <button className="icon-button" aria-label="通知">
              <Icon name="bell" />
              <span />
            </button>
            <div className="profile">
              <div className="avatar">{profile?.displayName.slice(0, 1) || "U"}</div>
              <div>
                <strong>{profile?.displayName}</strong>
                <small>
                  {profile?.role === "admin"
                    ? "系統管理員"
                    : profile?.role === "manager"
                      ? "護理主管"
                      : "專科護理師"}
                </small>
              </div>
            </div>
            <button className="logout-button" onClick={() => void logout()}>
              登出
            </button>
          </div>
        </header>

        <div className="context-bar">
          <div className="shift-switch">
            {(["白班", "小夜班", "大夜班"] as Shift[]).map((shift) => (
              <button
                aria-pressed={activeShift === shift}
                className={activeShift === shift ? "selected" : ""}
                key={shift}
                onClick={() => setActiveShift(shift)}
              >
                {shift}
              </button>
            ))}
          </div>
          <div className="context-info">
            <span>
              <Icon name="clock" /> 本班{" "}
              {activeShift === "白班"
                ? "08:00—16:00"
                : activeShift === "小夜班"
                  ? "16:00—00:00"
                  : "00:00—08:00"}
            </span>
            <span><Icon name="shield" /> 資料保存 {retentionDays} 天</span>
            <span className={dataLoading ? "syncing" : "synced"}>
              <i /> {dataLoading ? "同步資料中" : "Firebase 已同步"}
            </span>
          </div>
          <button className="primary-button" onClick={() => setModal("type")}>
            <Icon name="patient" /> 新增交班資料
          </button>
        </div>

        {view === "overview" && (
          <div className="page-content">
            <section className="welcome-strip">
              <div>
                <span className="live-pill"><i /> {activeShift}資料</span>
                <h2>早安，{profile?.displayName}</h2>
                <p>本班有 {pendingCount} 項待處理問題，其中 {highCount} 項需要優先關注。</p>
              </div>
              <div className="handover-progress">
                <div>
                  <span>交班完成度</span>
                  <strong>68%</strong>
                </div>
                <div className="progress-track"><i style={{ width: "68%" }} /></div>
                <small>已確認 15 / 22 項</small>
              </div>
            </section>

            <section className="stats-grid">
              <StatCard label="新病人數" value={visiblePatients.length} tone="blue" note="本班新收治" icon="patient" />
              <StatCard label="待處理數" value={pendingCount} tone="amber" note="需持續追蹤" icon="clock" />
              <StatCard label="高優先數" value={highCount} tone="red" note="請優先處置" icon="trouble" />
              <StatCard label="已完成數" value={completedCount} tone="green" note="本班已結案" icon="check" />
            </section>

            <section className="split-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker blue">新病人</span>
                  <h2>本班新收治</h2>
                  <p>入院資訊、目前病況與待辦事項</p>
                </div>
                <button className="text-button" onClick={() => setView("new_patients")}>查看全部 <Icon name="chevron" /></button>
              </div>
              <div className="patient-cards">
                {visiblePatients.slice(0, 2).map((patient) => (
                  <article className="patient-card" key={patient.id}>
                    <div className="bed-badge">{patient.bedNo}</div>
                    <div className="patient-card-main">
                      <div>
                        <h3>{patient.patientAlias || "未填代稱"}</h3>
                        <span>{patient.attendingDoctor}</span>
                      </div>
                      <p>{patient.primaryDiagnosis || patient.admissionReason}</p>
                      <div className="tag-row">
                        {patient.isolation && patient.isolation !== "無" && <span className="tag warning">{patient.isolation}</span>}
                        <span className="tag">{patient.admissionSource}</span>
                        <span className="tag">{patient.admissionDate.slice(5).replace("-", "/")} 入院</span>
                      </div>
                    </div>
                    <div className="patient-card-note">
                      <small>夜間注意</small>
                      <p>{patient.nightPrecautions || "無特殊注意事項"}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="split-section trouble-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker purple">Trouble shooting</span>
                  <h2>待處理與追蹤</h2>
                  <p>一個問題一筆，避免重要狀況被埋沒</p>
                </div>
                <button className="text-button" onClick={() => setView("troubleshooting")}>查看全部 <Icon name="chevron" /></button>
              </div>
              <TroubleTable rows={visibleTroubles.filter((item) => item.status !== "completed").slice(0, 3)} />
            </section>
          </div>
        )}

        {view === "new_patients" && (
          <div className="page-content">
            <section className="list-hero new-hero">
              <div>
                <span className="section-kicker blue">NEW PATIENT</span>
                <h2>新病人交班清單</h2>
                <p>目前顯示 {activeShift}，共 {visiblePatients.length} 筆新病人資料。</p>
              </div>
              <button className="secondary-button" onClick={() => openPrint("new_patient")}>
                <Icon name="print" /> 預覽新病人交班單
              </button>
            </section>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>床號／病人</th>
                    <th>主要診斷／入院原因</th>
                    <th>目前狀況</th>
                    <th>待辦及注意事項</th>
                    <th>交班者</th>
                    <th>更新</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePatients.map((patient) => (
                    <tr key={patient.id}>
                      <td><b className="bed-number">{patient.bedNo}</b><strong>{patient.patientAlias || "—"}</strong><small>{patient.attendingDoctor}</small></td>
                      <td><strong>{patient.primaryDiagnosis || "—"}</strong><small>{patient.admissionReason}</small></td>
                      <td><span>{patient.consciousness}</span><small>{patient.respiratoryCirculation}</small></td>
                      <td><span>{patient.pendingLabs || patient.pendingExams || "目前無待辦"}</span><small className="danger-text">{patient.reportConditions}</small></td>
                      <td>{patient.handoverBy}</td>
                      <td>
                        <small>{patient.updatedAt.slice(5, 16).replace("T", " ")}</small>
                        <PatientActionMenu
                          canDelete={canDelete(patient.createdBy)}
                          onDelete={() => void removeRecord("new_patient", patient.id, patient.createdBy)}
                          onEdit={() => editPatient(patient)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "troubleshooting" && (
          <div className="page-content">
            <section className="list-hero trouble-hero">
              <div>
                <span className="section-kicker purple">TROUBLE SHOOTING</span>
                <h2>問題處理清單</h2>
                <p>目前顯示 {activeShift}，共 {visibleTroubles.length} 筆 Trouble shooting 資料。</p>
              </div>
              <button className="secondary-button" onClick={() => openPrint("troubleshooting")}>
                <Icon name="print" /> 預覽特殊交班單
              </button>
            </section>
            <div className="filter-row">
              <button className="filter-active">全部 {visibleTroubles.length}</button>
              <button>待處理 {pendingCount}</button>
              <button>高優先 {highCount}</button>
              <button>已完成 {completedCount}</button>
            </div>
            <TroubleTable
              rows={visibleTroubles}
              detailed
              canDelete={(item) => canDelete(item.createdBy)}
              onConditionUpdate={openConditionUpdate}
              onDelete={(item) => void removeRecord("troubleshooting", item.id, item.createdBy)}
              onEdit={editTrouble}
              onStatusChange={(item, status) => void updateTroubleStatus(item, status)}
            />
          </div>
        )}

        {view === "print" && (
          <div className="print-page">
            <section className="print-controls">
              <div className="print-control-title">
                <div>
                  <span className="section-kicker purple">PRINT CENTER</span>
                  <h2>列印設定</h2>
                  <p>兩種交班單使用獨立版型，不會合併在同一張表格。</p>
                </div>
                <button className="primary-button" onClick={() => window.print()}>
                  <Icon name="print" /> 開始列印
                </button>
              </div>

              <div className="print-type-selector">
                {([
                  ["new_patient", "新病人交班單", "夜班／值班新病人交班單"],
                  ["troubleshooting", "Trouble shooting 交班單", "夜班／值班特殊交班單"],
                  ["all", "兩種都列印", "依序產生並強制分頁"],
                ] as const).map(([type, title, note]) => (
                  <button
                    className={settings.type === type ? "selected" : ""}
                    key={type}
                    onClick={() => setSettings((current) => ({ ...current, type }))}
                  >
                    <i>{settings.type === type ? "✓" : ""}</i>
                    <strong>{title}</strong>
                    <small>{note}</small>
                  </button>
                ))}
              </div>

              <div className="settings-grid">
                <Field label="日期" type="date" value={settings.date} onChange={(date) => setSettings((current) => ({ ...current, date }))} />
                <Field label="班別" value={settings.shift} options={["大夜班", "小夜班", "白班", "全部班別"]} onChange={(shift) => setSettings((current) => ({ ...current, shift: shift as PrintSettings["shift"] }))} />
                <Field label="單位" value={settings.unit} options={[UNIT, "ICU", "一般內科病房"]} onChange={(unit) => setSettings((current) => ({ ...current, unit }))} />
              </div>

              <div className="option-list">
                {settings.type !== "new_patient" && (
                  <>
                    <Toggle label="顯示已完成 Trouble shooting" checked={settings.includeCompleted} onChange={(includeCompleted) => setSettings((current) => ({ ...current, includeCompleted }))} />
                    <Toggle label="顯示已取消 Trouble shooting" checked={settings.includeCancelled} onChange={(includeCancelled) => setSettings((current) => ({ ...current, includeCancelled }))} />
                  </>
                )}
                <Toggle label="加入空白列" checked={settings.includeBlankRows} onChange={(includeBlankRows) => setSettings((current) => ({ ...current, includeBlankRows }))} />
                {settings.includeBlankRows && (
                  <label className="compact-number">空白列數量
                    <input type="number" min={1} max={8} value={settings.blankRowCount} onChange={(event) => setSettings((current) => ({ ...current, blankRowCount: Math.max(1, Math.min(8, Number(event.target.value))) }))} />
                  </label>
                )}
                <Toggle label="顯示建立者與更新時間" checked={settings.showMetadata} onChange={(showMetadata) => setSettings((current) => ({ ...current, showMetadata }))} />
                {settings.type === "all" && (
                  <Toggle label="沒有資料時不列印空白表" checked={settings.skipEmptySheets} onChange={(skipEmptySheets) => setSettings((current) => ({ ...current, skipEmptySheets }))} />
                )}
              </div>

              <div className="print-shortcuts">
                <button onClick={() => openPrint("new_patient", true)}>列印新病人交班單</button>
                <button onClick={() => openPrint("troubleshooting", true)}>列印 Trouble shooting 交班單</button>
                <button className="all" onClick={() => openPrint("all", true)}>全部列印</button>
              </div>
            </section>

            <section className="preview-area">
              <div className="preview-toolbar">
                <div><span className="preview-dot" /> 列印預覽</div>
                <span>A4 橫向 · 100%</span>
              </div>
              <div className="paper-stack">
                {(settings.type === "new_patient" || settings.type === "all") &&
                  (!settings.skipEmptySheets || printPatients.length > 0) && (
                    <NewPatientPrintSheet rows={printPatients} settings={settings} />
                  )}
                {settings.type === "all" &&
                  (!settings.skipEmptySheets || printPatients.length > 0) &&
                  (!settings.skipEmptySheets || printTroubles.length > 0) && (
                    <div className="forced-page-break">
                      <span>列印時於此處強制換頁</span>
                    </div>
                  )}
                {(settings.type === "troubleshooting" || settings.type === "all") &&
                  (!settings.skipEmptySheets || printTroubles.length > 0) && (
                    <TroubleshootingPrintSheet rows={printTroubles} settings={settings} />
                  )}
                {settings.skipEmptySheets &&
                  printPatients.length === 0 &&
                  printTroubles.length === 0 && (
                    <div className="empty-state">
                      <strong>此篩選條件沒有可列印資料</strong>
                      <span>請調整日期、班別或單位。</span>
                    </div>
                  )}
              </div>
            </section>
          </div>
        )}

        {view === "admin" && (
          <div className="page-content">
            <section className="admin-grid">
              <article className="admin-panel">
                <span className="section-kicker purple">DATA RETENTION</span>
                <h2>交班資料保存與清理</h2>
                <p>新病人與 Trouble shooting 套用相同永久清除規則；清除後無法復原。</p>
                <div className="retention-choice">
                  {[3, 4, 5].map((days) => (
                    <button className={retentionDays === days ? "selected" : ""} key={days} onClick={() => setRetentionDays(days)}>
                      <strong>{days}</strong><span>天</span>
                    </button>
                  ))}
                </div>
                <div className="schedule-card">
                  <div className="schedule-icon"><Icon name="clock" /></div>
                  <div><strong>自動清理已啟用</strong><span>每日 03:00（Asia/Taipei）</span></div>
                  <i className="toggle-visual on" />
                </div>
                <button className="danger-button" onClick={runPurge}>立即執行例行清理</button>
              </article>

              <article className="admin-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="section-kicker blue">LAST PURGE</span>
                    <h2>最近一次清理結果</h2>
                  </div>
                  <span className="success-badge"><Icon name="check" /> 成功</span>
                </div>
                <p>執行時間：{lastPurge}</p>
                <div className="purge-stats">
                  <div><span>新病人</span><strong>{purgeStats.newPatients}</strong><small>筆</small></div>
                  <div><span>Trouble shooting</span><strong>{purgeStats.troubleshooting}</strong><small>筆</small></div>
                  <div><span>時間軸 updates</span><strong>{purgeStats.updates}</strong><small>筆</small></div>
                  <div><span>Handover sessions</span><strong>{purgeStats.sessions}</strong><small>筆</small></div>
                </div>
                <div className="purge-rule">
                  <strong>永久清除範圍</strong>
                  <span>new_patients</span>
                  <span>troubleshooting_items</span>
                  <span>troubleshooting_updates</span>
                  <span>handover_sessions</span>
                  <span>相關 audit_logs</span>
                </div>
              </article>

              <article className="admin-panel account-admin">
                <div className="panel-title-row">
                  <div>
                    <span className="section-kicker purple">ACCESS CONTROL</span>
                    <h2>使用者與權限</h2>
                    <p>新申請帳號必須由管理員核准後才能讀取交班資料。</p>
                  </div>
                  <span className="account-count">
                    {profiles.filter((item) => item.status === "pending").length} 待核准
                  </span>
                </div>
                <div className="account-table-wrap">
                  <table className="account-table">
                    <thead>
                      <tr>
                        <th>使用者</th>
                        <th>角色</th>
                        <th>單位</th>
                        <th>狀態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((item) => (
                        <tr key={item.uid}>
                          <td>
                            <strong>{item.displayName}</strong>
                            <small>{item.email}</small>
                          </td>
                          <td>
                            <select
                              value={item.role}
                              disabled={item.uid === user?.uid}
                              onChange={(event) =>
                                void updateProfileAccess(
                                  item,
                                  item.status,
                                  event.target.value as UserProfile["role"],
                                )
                              }
                            >
                              <option value="member">member</option>
                              <option value="manager">manager</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td>{item.unitName}</td>
                          <td>
                            <span className={`account-status ${item.status}`}>
                              {item.status === "active"
                                ? "已啟用"
                                : item.status === "pending"
                                  ? "待核准"
                                  : "已停用"}
                            </span>
                          </td>
                          <td>
                            {item.uid === user?.uid ? (
                              <span className="self-label">目前帳號</span>
                            ) : item.status === "active" ? (
                              <button
                                className="disable-account"
                                onClick={() =>
                                  void updateProfileAccess(item, "disabled")
                                }
                              >
                                停用
                              </button>
                            ) : (
                              <button
                                className="approve-account"
                                onClick={() =>
                                  void updateProfileAccess(item, "active")
                                }
                              >
                                核准
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          </div>
        )}
      </main>

      {modal === "type" && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal type-modal" role="dialog" aria-modal="true" aria-labelledby="type-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="關閉"><Icon name="close" /></button>
            <span className="modal-step">步驟 1 / 2</span>
            <h2 id="type-title">選擇交班資料類型</h2>
            <p>請先選擇類型，再進入對應表單。建立後不可直接轉換類型。</p>
            <div className="type-cards">
              <button className="type-card patient-type" onClick={() => chooseType("new_patient")}>
                <span className="type-card-icon"><Icon name="patient" /></span>
                <span><strong>新增新病人</strong><small>記錄入院原因、目前狀況、治療與待辦</small></span>
                <Icon name="chevron" />
              </button>
              <button className="type-card trouble-type" onClick={() => chooseType("troubleshooting")}>
                <span className="type-card-icon"><Icon name="trouble" /></span>
                <span><strong>新增 Trouble shooting</strong><small>一個問題一筆，追蹤特殊情況與處置</small></span>
                <Icon name="chevron" />
              </button>
            </div>
            <div className="guard-note"><Icon name="shield" /> 系統不允許建立未分類資料</div>
          </section>
        </div>
      )}

      {modal === "new_patient" && (
        <div className="modal-backdrop">
          <form className="modal form-modal" onSubmit={savePatient}>
            <header className="form-modal-header">
              <div><span className="type-label patient-label">新病人</span><h2>{editingId ? "編輯新病人交班" : "新增新病人交班"}</h2><p>獨立表單 · handover_type: new_patient</p></div>
              <button type="button" className="modal-close static" onClick={() => { setModal(null); setEditingId(null); }} aria-label="關閉"><Icon name="close" /></button>
            </header>
            <div className="form-scroll">
              <FormSection number="01" title="病人基本資料">
                <Field label="交班日期" required type="date" value={patientForm.handoverDate} onChange={(handoverDate) => setPatientForm({ ...patientForm, handoverDate })} />
                <Field label="班別" required value={patientForm.shift} options={["白班", "小夜班", "大夜班"]} onChange={(shift) => setPatientForm({ ...patientForm, shift: shift as Shift })} />
                <Field label="床號" required value={patientForm.bedNo} placeholder="例：1208-1" onChange={(bedNo) => setPatientForm({ ...patientForm, bedNo })} />
                <Field label="病人代稱" value={patientForm.patientAlias} placeholder="請勿輸入完整身分證字號" onChange={(patientAlias) => setPatientForm({ ...patientForm, patientAlias })} />
                <Field label="主治醫師" value={patientForm.attendingDoctor} onChange={(attendingDoctor) => setPatientForm({ ...patientForm, attendingDoctor })} />
                <Field label="入院日期" type="date" value={patientForm.admissionDate} onChange={(admissionDate) => setPatientForm({ ...patientForm, admissionDate })} />
                <Field label="入院來源" value={patientForm.admissionSource} options={["", "急診", "門診", "他院轉入", "院內轉入"]} onChange={(admissionSource) => setPatientForm({ ...patientForm, admissionSource })} />
              </FormSection>
              <FormSection number="02" title="入院原因與診斷">
                <Field label="主要診斷" value={patientForm.primaryDiagnosis} placeholder="主要診斷或入院原因至少填一項" span={2} onChange={(primaryDiagnosis) => setPatientForm({ ...patientForm, primaryDiagnosis })} />
                <Field label="入院原因" type="textarea" value={patientForm.admissionReason} span={2} onChange={(admissionReason) => setPatientForm({ ...patientForm, admissionReason })} />
                <Field label="重要病史" type="textarea" value={patientForm.importantHistory} span={2} onChange={(importantHistory) => setPatientForm({ ...patientForm, importantHistory })} />
              </FormSection>
              <FormSection number="03" title="目前狀況">
                <Field label="目前意識狀態" value={patientForm.consciousness} onChange={(consciousness) => setPatientForm({ ...patientForm, consciousness })} />
                <Field label="呼吸與循環狀況" value={patientForm.respiratoryCirculation} onChange={(respiratoryCirculation) => setPatientForm({ ...patientForm, respiratoryCirculation })} />
                <Field label="管路" value={patientForm.lines} onChange={(lines) => setPatientForm({ ...patientForm, lines })} />
                <Field label="飲食" value={patientForm.diet} onChange={(diet) => setPatientForm({ ...patientForm, diet })} />
                <Field label="活動狀況" value={patientForm.activity} onChange={(activity) => setPatientForm({ ...patientForm, activity })} />
                <Field label="隔離狀態" value={patientForm.isolation} onChange={(isolation) => setPatientForm({ ...patientForm, isolation })} />
              </FormSection>
              <FormSection number="04" title="重要治療">
                <Field label="重要治療與特殊處置" type="textarea" value={patientForm.importantTreatment} placeholder="抗生素、抗凝血、升壓劑、洗腎或其他治療" span={2} onChange={(importantTreatment) => setPatientForm({ ...patientForm, importantTreatment })} />
              </FormSection>
              <FormSection number="05" title="待辦事項">
                <Field label="待追蹤檢驗" value={patientForm.pendingLabs} onChange={(pendingLabs) => setPatientForm({ ...patientForm, pendingLabs })} />
                <Field label="待安排檢查" value={patientForm.pendingExams} onChange={(pendingExams) => setPatientForm({ ...patientForm, pendingExams })} />
                <Field label="會診" value={patientForm.consultation} onChange={(consultation) => setPatientForm({ ...patientForm, consultation })} />
                <Field label="家屬溝通" value={patientForm.familyCommunication} onChange={(familyCommunication) => setPatientForm({ ...patientForm, familyCommunication })} />
              </FormSection>
              <FormSection number="06" title="注意事項">
                <Field label="DNR 或治療限制" value={patientForm.treatmentLimit} onChange={(treatmentLimit) => setPatientForm({ ...patientForm, treatmentLimit })} />
                <Field label="夜間注意事項" type="textarea" value={patientForm.nightPrecautions} onChange={(nightPrecautions) => setPatientForm({ ...patientForm, nightPrecautions })} />
                <Field label="需要立即回報的條件" type="textarea" value={patientForm.reportConditions} span={2} onChange={(reportConditions) => setPatientForm({ ...patientForm, reportConditions })} />
                <Field label="交班者" value={patientForm.handoverBy} onChange={(handoverBy) => setPatientForm({ ...patientForm, handoverBy })} />
              </FormSection>
            </div>
            <FormFooter error={formError} onCancel={() => { setModal(null); setEditingId(null); }} submitLabel={editingId ? "儲存修改" : undefined} />
          </form>
        </div>
      )}

      {modal === "troubleshooting" && (
        <div className="modal-backdrop">
          <form className="modal form-modal" onSubmit={saveTrouble}>
            <header className="form-modal-header trouble-form-header">
              <div><span className="type-label trouble-label">Trouble shooting</span><h2>{editingId ? "編輯 Trouble shooting" : "新增 Trouble shooting"}</h2><p>一個問題一筆 · handover_type: troubleshooting</p></div>
              <button type="button" className="modal-close static" onClick={() => { setModal(null); setEditingId(null); }} aria-label="關閉"><Icon name="close" /></button>
            </header>
            <div className="form-scroll">
              <FormSection number="01" title="基本資訊">
                <Field label="日期" required type="date" value={troubleForm.handoverDate} onChange={(handoverDate) => setTroubleForm({ ...troubleForm, handoverDate })} />
                <Field label="班別" required value={troubleForm.shift} options={["白班", "小夜班", "大夜班"]} onChange={(shift) => setTroubleForm({ ...troubleForm, shift: shift as Shift })} />
                <Field label="床號" required value={troubleForm.bedNo} placeholder="例：1208-1" onChange={(bedNo) => setTroubleForm({ ...troubleForm, bedNo })} />
                <Field label="病人代稱" value={troubleForm.patientAlias} onChange={(patientAlias) => setTroubleForm({ ...troubleForm, patientAlias })} />
                <Field label="診斷" value={troubleForm.diagnosis} span={2} onChange={(diagnosis) => setTroubleForm({ ...troubleForm, diagnosis })} />
              </FormSection>
              <FormSection number="02" title="問題與優先程度">
                <Field label="問題類別" value={troubleForm.category} options={["病況變化", "呼吸", "循環", "檢驗", "用藥", "管路", "溝通", "其他"]} onChange={(category) => setTroubleForm({ ...troubleForm, category })} />
                <Field label="優先程度" value={troubleForm.priority} options={["high", "medium", "low"]} onChange={(priority) => setTroubleForm({ ...troubleForm, priority: priority as TroubleshootingItem["priority"] })} />
                <Field label="特殊情況" required type="textarea" value={troubleForm.specialSituation} span={2} onChange={(specialSituation) => setTroubleForm({ ...troubleForm, specialSituation })} />
              </FormSection>
              <FormSection number="03" title="處置與追蹤">
                <Field label="已完成處置" type="textarea" value={troubleForm.completedAction} span={2} onChange={(completedAction) => setTroubleForm({ ...troubleForm, completedAction })} />
                <Field label="尚待處理" type="textarea" value={troubleForm.pendingFollowup} span={2} onChange={(pendingFollowup) => setTroubleForm({ ...troubleForm, pendingFollowup })} />
                <Field label="預計追蹤時間" type="datetime-local" value={troubleForm.followupAt} onChange={(followupAt) => setTroubleForm({ ...troubleForm, followupAt })} />
                <Field label="負責人" value={troubleForm.ownerName} onChange={(ownerName) => setTroubleForm({ ...troubleForm, ownerName })} />
                <Field label="狀態" value={troubleForm.status} options={["pending", "in_progress", "waiting", "completed", "cancelled"]} onChange={(status) => setTroubleForm({ ...troubleForm, status: status as TroubleshootingStatus })} />
                <Field label="交班者" value={troubleForm.handoverBy} onChange={(handoverBy) => setTroubleForm({ ...troubleForm, handoverBy })} />
                <Field label="接班者" value={troubleForm.acceptedBy || ""} onChange={(acceptedBy) => setTroubleForm({ ...troubleForm, acceptedBy })} />
              </FormSection>
            </div>
            <FormFooter error={formError} onCancel={() => { setModal(null); setEditingId(null); }} submitLabel={editingId ? "儲存修改" : undefined} />
          </form>
        </div>
      )}

      {conditionTarget && (
        <div className="modal-backdrop">
          <form className="modal condition-modal" onSubmit={saveConditionUpdate}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setConditionTarget(null)}
              aria-label="關閉"
            >
              <Icon name="close" />
            </button>
            <span className="type-label trouble-label">目前病況</span>
            <h2>{conditionTarget.bedNo} · {conditionTarget.patientAlias}</h2>
            <p>新增內容會保留在時間軸，並記錄更新者與時間。</p>
            <label className="condition-field">
              <span>病況更新</span>
              <textarea
                autoFocus
                required
                value={conditionText}
                onChange={(event) => setConditionText(event.target.value)}
                placeholder="例：SpO₂ 已回升至 95%，持續使用 simple mask 6 L/min。"
              />
            </label>
            <div className="condition-actions">
              <button type="button" onClick={() => setConditionTarget(null)}>取消</button>
              <button type="submit">加入時間軸</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

function PatientActionMenu({
  canDelete,
  onDelete,
  onEdit,
}: {
  canDelete: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <details className="row-action-menu">
      <summary className="row-action" title="更多操作" aria-label="更多操作">
        ···
      </summary>
      <div className="action-popover">
        <button type="button" onClick={onEdit}>編輯資料</button>
        {canDelete ? (
          <button type="button" className="danger-action" onClick={onDelete}>
            刪除資料
          </button>
        ) : (
          <span className="action-help">只有建立者可刪除</span>
        )}
      </div>
    </details>
  );
}

function TroubleActionMenu({
  canDelete,
  item,
  onConditionUpdate,
  onDelete,
  onEdit,
  onStatusChange,
}: {
  canDelete: boolean;
  item: TroubleshootingItem;
  onConditionUpdate: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onStatusChange: (status: TroubleshootingStatus) => void;
}) {
  return (
    <details className="row-action-menu">
      <summary className="row-action" title="更多操作" aria-label="更多操作">
        ···
      </summary>
      <div className="action-popover trouble-actions">
        <span className="action-title">變更狀態</span>
        <div className="status-actions">
          {(
            [
              ["pending", "待處理"],
              ["in_progress", "處理中"],
              ["waiting", "待追蹤"],
              ["completed", "已完成"],
            ] as Array<[TroubleshootingStatus, string]>
          ).map(([status, label]) => (
            <button
              type="button"
              className={item.status === status ? "current-status" : ""}
              disabled={item.status === status}
              key={status}
              onClick={() => onStatusChange(status)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onConditionUpdate}>新增目前病況</button>
        <button type="button" onClick={onEdit}>編輯完整資料</button>
        {canDelete ? (
          <button type="button" className="danger-action" onClick={onDelete}>
            刪除資料
          </button>
        ) : (
          <span className="action-help">只有建立者可刪除</span>
        )}
      </div>
    </details>
  );
}

function TroubleTable({
  rows,
  detailed = false,
  canDelete,
  onConditionUpdate,
  onDelete,
  onEdit,
  onStatusChange,
}: {
  rows: TroubleshootingItem[];
  detailed?: boolean;
  canDelete?: (item: TroubleshootingItem) => boolean;
  onConditionUpdate?: (item: TroubleshootingItem) => void;
  onDelete?: (item: TroubleshootingItem) => void;
  onEdit?: (item: TroubleshootingItem) => void;
  onStatusChange?: (
    item: TroubleshootingItem,
    status: TroubleshootingStatus,
  ) => void;
}) {
  return (
    <div className="trouble-table-wrap">
      <table className="trouble-table">
        <thead>
          <tr>
            <th>優先</th>
            <th>床號／病人</th>
            <th>問題與處置</th>
            <th>追蹤時間</th>
            <th>負責人</th>
            <th>狀態</th>
            {detailed && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td><span className={`priority-dot ${item.priority}`} /><span className={`priority-text ${item.priority}`}>{item.priority === "high" ? "高" : item.priority === "medium" ? "中" : "低"}</span></td>
              <td><b className="bed-number">{item.bedNo}</b><strong>{item.patientAlias}</strong><small>{item.diagnosis}</small></td>
              <td><strong>{item.specialSituation}</strong><small><b>已處置</b> {item.completedAction || "尚無"}</small>{detailed && item.timelineUpdates.length > 0 && <span className="updates-count">{item.timelineUpdates.length} 則時間軸更新</span>}</td>
              <td><b>{item.followupAt ? item.followupAt.slice(11, 16) : "待確認"}</b><small>{item.pendingFollowup}</small></td>
              <td>{item.ownerName}</td>
              <td><span className={`status status-${item.status}`}>{statusText[item.status]}</span></td>
              {detailed && (
                <td>
                  <TroubleActionMenu
                    canDelete={canDelete?.(item) ?? false}
                    item={item}
                    onConditionUpdate={() => onConditionUpdate?.(item)}
                    onDelete={() => onDelete?.(item)}
                    onEdit={() => onEdit?.(item)}
                    onStatusChange={(status) => onStatusChange?.(item, status)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <header><span>{number}</span><h3>{title}</h3></header>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function FormFooter({
  error,
  onCancel,
  submitLabel = "儲存交班資料",
}: {
  error: string;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <footer className="form-footer">
      <div>{error && <span className="form-error">{error}</span>}</div>
      <button type="button" className="cancel-button" onClick={onCancel}>取消</button>
      <button type="submit" className="primary-button"><Icon name="check" /> {submitLabel}</button>
    </footer>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i className={checked ? "on" : ""} />
    </label>
  );
}
