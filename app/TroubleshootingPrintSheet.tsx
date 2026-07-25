"use client";

import type { PrintSettings, TroubleshootingItem } from "./types";

function text(value?: string) {
  return value?.trim() || "—";
}

export function TroubleshootingPrintSheet({
  rows,
  settings,
}: {
  rows: TroubleshootingItem[];
  settings: PrintSettings;
}) {
  const blanks = settings.includeBlankRows
    ? Array.from({ length: settings.blankRowCount }, (_, index) => index)
    : [];

  return (
    <section
      className="print-sheet troubleshooting-print"
      data-print-sheet="troubleshooting"
    >
      <header className="print-header">
        <div>
          <span>單位：{settings.unit}</span>
          <span>班別：{settings.shift}</span>
        </div>
        <h1>夜班／值班特殊交班單</h1>
        <div>
          <span>日期：{settings.date}</span>
          <span>第＿＿頁</span>
        </div>
      </header>

      <table>
        <colgroup>
          <col style={{ width: "9%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "32%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>日期</th>
            <th>病人基本資料</th>
            <th>診斷</th>
            <th>特殊情況及處理</th>
            <th>追蹤</th>
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
                <b>{row.bedNo}</b>
                <br />
                {text(row.patientAlias)}
                <br />
                <span className={`print-priority priority-${row.priority}`}>
                  {row.priority === "high"
                    ? "高優先"
                    : row.priority === "medium"
                      ? "中優先"
                      : "低優先"}
                </span>
              </td>
              <td>
                {text(row.diagnosis)}
                <small>{row.category}</small>
              </td>
              <td>
                <div>
                  <b>特殊情況：</b>
                  {text(row.specialSituation)}
                </div>
                {row.completedAction && (
                  <div>
                    <b>已完成：</b>
                    {row.completedAction}
                  </div>
                )}
                {row.timelineUpdates.map((update) => (
                  <div className="timeline-print" key={update.id}>
                    {update.time} {update.author}｜{update.content}
                  </div>
                ))}
              </td>
              <td>
                <b>{row.followupAt ? row.followupAt.replace("T", " ") : "待確認"}</b>
                <br />
                {text(row.pendingFollowup)}
                <small>負責：{text(row.ownerName)}</small>
              </td>
              <td className="signature-cell">
                交班：<span>{row.handoverBy || "＿＿＿＿"}</span>
                <br />
                接班：<span>{row.acceptedBy || "＿＿＿＿"}</span>
                {settings.showMetadata && (
                  <small>更新 {row.updatedAt.slice(5, 16).replace("T", " ")}</small>
                )}
                <div className="signature-space" />
              </td>
            </tr>
          ))}
          {blanks.map((index) => (
            <tr className="blank-print-row" key={`trouble-blank-${index}`}>
              {Array.from({ length: 6 }, (_, cell) => (
                <td key={cell}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && blanks.length === 0 && (
        <div className="print-empty">本班無 Trouble shooting 事項</div>
      )}

      <footer className="print-signatures">
        <span>值班醫師：＿＿＿＿＿＿＿＿</span>
        <span>部主任：＿＿＿＿＿＿＿＿</span>
      </footer>
    </section>
  );
}
