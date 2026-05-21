# CAP-Map 國中會考社會科時空地圖

CAP-Map 是一個專門為臺灣國中生設計的互動式學習網站，旨在協助學生準備國中教育會考（CAP）社會科。透過將歷史時間軸與地理空間深度結合，幫助學生建立立體史觀，並強化會考必考的「圖表與地圖判讀能力」。

本專案直接延伸自 [jymap](https://github.com/raybird/jymap) 的成熟時空地圖架構，並針對國中會考社會科的教學大綱與考試特性進行教育化增強。

---

## 核心特色

1. **時空同步探索（探索模式）**
   - **歷史時間軸**：拖曳底部時間軸，地圖上的標記會隨歷史朝代（荷西時期、明鄭時期、清領時期、日治時期等）動態過濾與呈現。
   - **空間地圖**：基於 Leaflet 地圖，精確定位歷史事件、戰役與重大地標的地理位置。
2. **會考考點與章節對應**
   - 每個歷史事件詳情側邊欄皆標註對應的**會考重要性（高/中/低）**、**教科書對應章節**（如社會科七年級上冊）以及**常見會考題型**（圖表判讀、概念解釋等）。
   - 強化歷史（何時發生）、地理（何地發生）與公民（社會制度）三科知識的橫向整合。
3. **地圖圖層切換**
   - 提供地形、氣候、行政邊界等主題圖層切換，幫助學生將歷史事件疊加於地理背景之上，強化空間推理與圖像理解。
4. **模糊搜尋與內容發現**
   - 整合 Fuse.js，支援快速模糊搜尋歷史事件、地點、相關人物與關鍵字。

---

## 技術棧

* **前端框架**：Angular 18 (SPA)
* **狀態管理**：NgRx Store / Effects
* **地圖引擎**：Leaflet (與 `@types/leaflet`)
* **搜尋引擎**：Fuse.js (模糊搜尋)
* **UI 樣式**：Angular Material / Custom CSS

---

## 專案結構

```text
├── .github/workflows/       # GitHub Actions 自動化部署工作流 (Deploy to GitHub Pages)
├── docs/                    # 專案文件與設計規格書
│   └── superpowers/specs/   # 會考時空地圖設計規格書
└── webapp/                  # Angular 前端專案目錄
    ├── public/              # 靜態資源 (包含 favicon.ico 與候選圖檔)
    └── src/
        └── app/
            ├── core/        # 核心模組與資料結構
            ├── store/       # NgRx 狀態管理 (Actions, Reducers, Selectors, Effects)
            ├── services/    # 事件載入與時間軸服務
            └── features/    # 核心元件 (地圖、時間軸、搜尋、側邊欄等)
```

---

## 快速開始

### 本地開發步驟

在開始之前，請確保您的系統已安裝 [Node.js](https://nodejs.org/) (建議 v20 以上) 與 `npm`。

1. **複製本儲存庫**：
   ```bash
   git clone https://github.com/raybird/cap-map.git
   cd cap-map
   ```

2. **進入 `webapp` 目錄並安裝相依套件**：
   ```bash
   cd webapp
   npm install
   ```

3. **啟動本地開發伺服器**：
   ```bash
   npm run start
   # 或使用 ng serve
   ```
   啟動後，請於瀏覽器中開啟 `http://localhost:4200` 即可進行預覽。

---

## 部署與發布 (GitHub Pages)

本專案已設定 GitHub Actions。當變更被推送（Push）至 `main` 分支時，工作流會自動執行建置並部署至 GitHub Pages：

* **網頁預覽網址**：`https://raybird.github.io/cap-map/`
* **部署配置檔**：`.github/workflows/deploy.yml`

> [!NOTE]
> **GitHub Pages 設定步驟**：
> 1. 請至您的 GitHub 儲存庫，點選 **Settings** > 側邊欄 **Pages**。
> 2. 在 **Build and deployment** 下方的 **Source**，將下拉選單設定為 **`GitHub Actions`** 即可啟用自動部署。
