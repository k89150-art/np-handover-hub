# 交班中樞｜專科護理師多人交班系統

可操作的流程試作版，將交班資料明確分為「新病人」與
「Trouble shooting」兩種不可互相轉換的類型。

## 已完成流程

- 新增資料前先選擇類型，不允許未分類資料
- 新病人與 Trouble shooting 使用獨立表單、型別與資料表
- Dashboard 分區顯示，統計數字分開計算
- 新病人交班單與特殊交班單使用獨立 A4 橫向版型
- 全部列印時依序輸出兩張表，並在中間強制換頁
- 無資料時顯示明確空狀態，也可略過空白表
- 保存期限可設定為 3、4 或 5 天，清理結果分項統計
- Drizzle schema 與 migration 包含 `handover_type text not null`

## 試作版資料說明

目前畫面使用展示用假資料與瀏覽期間記憶體狀態，不會把病人交班內容寫入
`localStorage`。`db/schema.ts` 與 `drizzle/` 已保留正式資料庫結構；接上 D1、
Supabase 或院內資料服務後，可將新增、查詢與永久清除動作改接伺服器端 API。

## 開發

```bash
npm install
npm run dev
```

建置與檢查：

```bash
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```
