# 我們的家

夫妻共用家庭管理 PWA 的第一版操作原型。繁體中文、iPhone 響應式介面。

## 執行

需要 Node.js 22 以上，使用 Supabase SDK，建置時需要 esbuild。

```sh
cd /workspace/-
npm ci --cache /tmp/our-home-npm-cache
npm start
```

預設 3000 埠，可用 `PORT` 指定。`npm test` 驗證帳戶計算；`npm run check` 驗證 JS 語法。

## 已支援

- 共同帳戶基準餘額、補款、支出、個人支付、月度分類與低餘額提示。
- 共同行程、公開備註、多日期休假登記。
- 各寵物飲食、觀察、體重、餵藥、就診紀錄與飲食複製。
- 家務週期、完成與下次日期。
- 個別成員運動打卡、InBody 與趨勢。
- Email 註冊登入、家庭邀請、雲端存檔與同步、JSON 匯出還原、Web App manifest（需先完成下列後台設定）。

## Supabase 設定（尚待使用者執行）

1. 在自己的 Supabase 專案 SQL Editor 新建查詢，貼上並執行 `supabase/setup.sql` 全文。腳本可重複執行，不刪除現有資料。先在本機 PostgreSQL 相容引擎驗證，並非已在遠端執行。
2. Authentication 的 Email 登入及 Confirm email 須啟用。正式部署後在 URL Configuration 將 Site URL 設為部署的 HTTPS 網址，Redirect URLs 加入相同網址。確認信將導向該網站，勿使用 localhost 作為手機登入網址。
3. public/config.js 已設定使用者提供的 Project URL 與 Publishable key；它們可在瀏覽器公開。禁止使用 secret/service_role。
4. 使用 App 的建立帳號功能，兩人各用自己的 Email，收信驗證後登入。
5. 一人建立家庭，在帳戶設定填入另一半的 Email 並儲存邀請。不會自動寄邀請信，請自行告知對方。對方登入後按「接受另一半的邀請」。不要各自建立不同家庭。
6. 登入後家務、收支、行程、寵物與健康資料儲存在同一家庭的雲端文件。每 15 秒載入更新；編輯視窗開啟時不重載。可手動重新同步。

## 權限與一致性

資料表已啟用 RLS，且撤銷 anon/authenticated 的直接存取權。只允許已登入使用者透過 RPC 操作，RPC 以 auth.uid() 驗證家庭成員。家庭最多兩人，邀請以登入權杖的已驗證 Email 對應。必須保持 Email confirmation 啟用。

存檔比對 revision；若另一人先存入則拒絕本次修改，使用者須關閉編輯視窗、重新同步後重做，不會默默覆蓋。網路失敗不會顯示存檔成功。健康紀錄的先生／太太為固定分類，家庭雙方皆可編輯。無私人紀錄。

## 驗證與限制

`npm test` 包含帳戶計算、備份、模擬登入 UI 及本機 PostgreSQL 相容引擎的匿名拒絕、成員隔離、邀請、家庭容量、版本衝突測試。這不等於遠端 Supabase 或 iPhone 實機測試。

尚未部署；真實 Email 寄送、遠端資料庫及雙手機同步尚待 SQL 安裝與部署後驗證。無銀行串接、推播或離線快取。密碼重設 UI 尚待實作，管理員可先透過 Supabase 處理。InBody 不提供醫療診斷。舊版 `our-home-v1` 本機資料保留，未自動上傳；舊備份可登入後匯入，匯入會取代家庭所有資料，請先備份。

部署時先 `npm ci && npm run build`，將 public 目錄託管至 HTTPS 靜態網站，或在 HTTPS 反向代理後執行本服務。Safari 分享選單 → 加入主畫面。正式 iOS 品質驗證仍需實機，包含加入主畫面及 PNG Apple touch icon。
