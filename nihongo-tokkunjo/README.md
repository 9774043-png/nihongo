# 日語特訓所 — 部署說明

單頁靜態網站 + PWA，不需要後端、資料庫或建置流程。
把本資料夾的**全部內容**上傳到靜態網站主機即可。

---

## 檔案結構

```
index.html      主程式（單檔，含全部學習內容與邏輯）
tailwind.css    自建樣式表（36KB，已取代 Tailwind CDN）
manifest.json   PWA 設定：App 名稱、圖示、啟動方式
sw.js           Service Worker：離線快取
icons/          App 圖示（192 / 512 / maskable / apple-touch / favicon）
README.md       本說明
```

所有路徑都是相對路徑，因此放在網域根目錄或子目錄都能正常運作。
**必須整包一起上傳，並保持上述結構。**

---

## 部署到 GitHub Pages

### 1. 建立 repo

到 <https://github.com/new>：

- **Repository name**：`nihongo`（這會成為網址的一部分）
- **Public**：必選。免費帳號的 Private repo 無法使用 GitHub Pages
- Add README / .gitignore / license **都不要勾選**

按 **Create repository**。

### 2. 上傳檔案

在新 repo 的空白頁點 **「uploading an existing file」**，然後把以下項目一起拖進瀏覽器：

```
index.html    tailwind.css    manifest.json    sw.js    README.md    icons/
```

> ⚠️ **最容易出錯的一步**：要拖「本資料夾**裡面**的東西」，
> 不是拖資料夾本身。拖錯的話檔案會變成 `nihongo-tokkunjo/index.html`，
> 網址多一層，PWA 會失效。
> 上傳清單最上面應該直接是 `icons`、`index.html`，而不是資料夾名稱。

捲到頁面底部按 **Commit changes**。

### 3. 開啟 Pages

repo 上方 **Settings** → 左側 **Pages**：

- **Source**：`Deploy from a branch`
- **Branch**：`main`，資料夾選 `/ (root)`
- 按 **Save**

### 4. 取得網址

到 **Actions** 分頁等 workflow 變綠勾（約 1 分鐘），
回到 Settings → Pages，最上方會顯示網址：

```
https://<你的帳號>.github.io/nihongo/
```

### 改用 Git 指令

```bash
cd nihongo-tokkunjo          # 注意：在資料夾「裡面」執行
git init
git add .
git commit -m "日語特訓所 初版"
git branch -M main
git remote add origin https://github.com/<你的帳號>/nihongo.git
git push -u origin main
```

推送後仍須執行上面第 3 步開啟 Pages 功能。

---

## 其他主機（擇一）

- **Cloudflare Pages / Netlify Drop**：直接把資料夾拖進 Drop 區，立刻取得 HTTPS 網址。
- **Firebase Hosting**：`firebase init hosting`（public 目錄填本資料夾，
  「設為單頁應用」選 **No**）→ `firebase deploy`。

---

## 手機安裝成 App

- **Android / Chrome**：開啟網址 → 右上選單 → 「安裝應用程式」／「加到主畫面」
- **iPhone / Safari**：開啟網址 → 下方分享鈕 → 「加入主畫面」
  （iOS 僅 Safari 支援安裝，Chrome for iOS 無法）

安裝後以全螢幕開啟，沒有瀏覽器網址列。

---

## 離線能力

第一次連網開啟後，Service Worker 會快取程式與外部資源，之後離線可用。

**完全不需連網的部分**：

- 五十音、單字、文法、會話的全部內容（都寫在 `index.html` 裡）
- 情境圖卡（瀏覽器即時生成的 SVG）
- 學習進度（瀏覽器 localStorage）

**僅第一次需要連網**：Font Awesome 圖示、Google Fonts 的 Noto Sans JP、
彩帶動畫。之後都走快取。

---

## 注意事項

**必須是 HTTPS**（`localhost` 除外）。Service Worker 與語音辨識都要求安全連線；
上述主機均自動提供 HTTPS。

**改版後手機仍顯示舊版**：這是 Service Worker 快取的正常行為。
每次更新內容時，請修改 `sw.js` 的版本號：

```js
const CACHE_VERSION = 'v1';   // 改成 'v2'、'v3'…
```

若在 `index.html` 新增了 Tailwind class，`tailwind.css` 也需重新產生，
否則新樣式不會生效。

**學習進度存在各裝置本機**，手機與電腦的進度不互通，
清除瀏覽器資料會消失。跨裝置同步需要接後端（例如 Firebase）。

---

## 本機預覽

```bash
python3 -m http.server 8000
# 瀏覽器開 http://localhost:8000
```

直接雙擊 `index.html`（`file://` 協定）無法註冊 Service Worker，請用上述方式預覽。
