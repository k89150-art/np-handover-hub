"use client";

import type { NewPatient, PrintSettings } from "./types";

function lines(entries: Array<[string, string | undefined]>) {
  return entries
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => (
      <div className="print-line" key={label}>
        <b>{label}：</b>
        {value}
      </div>
    ));
}

export function NewPatientPrintSheet({
  rows,
  settings,
}: {
  rows: NewPatient[];
  settings: PrintSettings;
}) {
  const blanks = settings.includeBlankRows
    ? Array.from({ length: settings.blankRowCount }, (_, index) => index)
    : [];

  return (
    <section className="print-sheet new-patient-print" data-print-sheet="new_patient">
      <header className="print-header">
        <div>
          <span>單位：{settings.unit}</span>
          <span>班別：{settings.shift}</span>
        </div>
        <h1>夜班／值班新病人交班單</h1>
        <div>
          <span>日期：{settings.date}</span>
          <span>第＿＿頁</span>
        </div>
      </header>

      <table>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>日期</th>
            <th>病人基本資料</th>
            <th>主要診斷／入院原因</th>
            <th>目前狀況</th>
            <th>重要治療</th>
            <th>待辦及注意事項</th>
            <th>交接者／接班者</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.handoverDate.slice(5).replace("-", "/")}
                <small>{row.shift}</small>
              </td>
              <td>
                {lines([
                  ["床號", row.bedNo],
                  ["代稱", row.patientAlias],
                  ["主治", row.attendingDoctor],
                  ["入院", row.admissionDate],
                  ["來源", row.admissionSource],
                ])}
              </td>
              <td>
                {lines([
                  ["診斷", row.primaryDiagnosis],
                  ["原因", row.admissionReason],
                  ["病史", row.importantHistory],
                ])}
              </td>
              <td>
                {lines([
                  ["意識", row.consciousness],
                  ["呼吸／循環", row.respiratoryCirculation],
                  ["管路", row.lines],
                  ["飲食", row.diet],
                  ["活動", row.activity],
                  ["隔離", row.isolation],
                ])}
              </td>
              <td>{lines([["治療", row.importantTreatment]])}</td>
              <td>
                {lines([
                  ["檢驗", row.pendingLabs],
                  ["檢查", row.pendingExams],
                  ["會診", row.consultation],
                  ["家屬", row.familyCommunication],
                  ["夜間", row.nightPrecautions],
                  ["立即回報", row.reportConditions],
                  ["限制", row.treatmentLimit],
                ])}
                {settings.showMetadata && (
                  <small>
                    建立 {row.createdAt.slice(5, 16).replace("T", " ")}
                    <br />
                    更新 {row.updatedAt.slice(5, 16).replace("T", " ")}
                  </small>
                )}
              </td>
              <td className="signature-cell">
                交班：<span>{row.handoverBy || "＿＿＿＿"}</span>
                <br />
                接班：<span>{row.acceptedBy || "＿＿＿＿"}</span>
                <div className="signature-space" />
              </td>
            </tr>
          ))}
          {blanks.map((index) => (
            <tr className="blank-print-row" key={`new-blank-${index}`}>
              {Array.from({ length: 7 }, (_, cell) => (
                <td key={cell}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && blanks.length === 0 && (
        <div className="print-empty">本班無新病人</div>
      )}

      <footer className="print-signatures">
        <span>值班醫師：＿＿＿＿＿＿＿＿</span>
        <span>部主任：＿＿＿＿＿＿＿＿</span>
      </footer>
    </section>
  );
}
