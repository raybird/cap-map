# CAP-Map 國中會考社會科時空地圖

CAP-Map 是一個專門為臺灣國中生設計的互動式學習網站，旨在協助學生準備國中教育會考（CAP）社會科。透過將歷史時間軸與地理空間深度結合，幫助學生建立跨區域史觀，並強化會考必考的「圖表與地圖判讀能力」。

**線上預覽**：[https://raybird.github.io/cap-map/](https://raybird.github.io/cap-map/)

---

## 資料範圍

目前收錄 **106 筆事件**，涵蓋臺灣史、中國史與世界史三個面向，橫跨西元前 5000 年至 2025 年。

| 分類 | 事件數 | 說明 |
|------|--------|------|
| 歷史 | 106 | 全部事件皆含歷史脈絡 |
| 地理 | 53 | 具有顯著地理空間意義 |
| 公民 | 34 | 涉及政治制度、民主化或公民社會 |

各分期事件數：

| 分期 | 年代 | 事件數 |
|------|------|--------|
| 史前時代 | 5000 BCE – 1000 BCE | 7 |
| 古代文明 | 1000 BCE – 600 CE | 11 |
| 中古交流 | 601 – 1399 | 11 |
| 近世交流 | 1400 – 1749 | 16 |
| 近代變革 | 1750 – 1945 | 41 |
| 戰後時期 | 1946 – 1987 | 14 |
| 民主化時期 | 1987 – 2000 | 4 |
| 當代 | 2000 – 2025 | 2 |

時間軸依八個全球史分期組織：

| 分期 | 年代 | 代表主題 |
|------|------|----------|
| 史前時代 | 5000 BCE – 1000 BCE | 史前文化與早期聚落 |
| 古代文明 | 1000 BCE – 600 CE | 帝國、絲路、早期政權 |
| 中古交流 | 601 – 1399 | 宗教、政權、跨區域交流 |
| 近世交流 | 1400 – 1749 | 大航海、海上貿易、臺灣開發 |
| 近代變革 | 1750 – 1945 | 工業革命、殖民、世界大戰 |
| 戰後秩序 | 1946 – 1990 | 冷戰、戰後重建、兩岸分治 |
| 民主化 | 1991 – 2009 | 政治自由化、民主鞏固 |
| 當代 | 2010 – 今 | 全球化、社會運動、當代議題 |

---

## 核心功能

### 時空同步探索
- **歷史時間軸**：底部橫向拖曳軸，從西元前 5000 年延伸至 2025 年，以 10px/年比例呈現。點擊分期色帶可快速過濾對應時代的事件。
- **互動地圖**：基於 Leaflet，精確定位每筆事件的地理座標，支援圖層篩選（歷史／地理／公民）。點擊標記後地圖自動飛入並開啟彈出卡片。

### 事件詳情側邊欄
- 顯示事件標題、年代、地點、詳細描述與關鍵字標籤。
- 標註**會考重要性**（高／中／低）、**教科書對應章節**（七上・七下・八上・八下・九上・九下）及常見題型。
- 點擊「相關事件」可直接跳轉至關聯事件。

### 自動出題小測驗
- 每個事件自動生成 3 題選擇題，題型涵蓋：分期判斷、地點辨識、關鍵字配對、時序排列。
- 干擾選項從全資料集動態生成，避免重複。

### 模糊搜尋
- 整合 Fuse.js，對 `title`、`description`、`keywords` 三欄位進行模糊比對（threshold 0.3）。

### 行動版適應佈局
- 桌機：側邊欄從右側滑入（380px）。
- 手機（≤480px）：側邊欄以底部 Sheet 呈現（佔 62vh），地圖自動偏移確保焦點標記出現在可見區域中央。

---

## 技術棧

| 層次 | 技術 |
|------|------|
| 前端框架 | Angular 20 (NgModule pattern) |
| 狀態管理 | NgRx Store 20（event / map / timeline 三個 slice） |
| 地圖引擎 | Leaflet + @types/leaflet |
| 搜尋引擎 | Fuse.js |
| 樣式 | Custom CSS（Noto Sans TC / Noto Serif TC） |

---

## 專案結構

```text
cap-map/
├── .github/workflows/deploy.yml   # 自動部署至 GitHub Pages
├── docs/                          # 設計規格書
└── webapp/                        # Angular 應用程式
    ├── public/assets/data/
    │   ├── events.json            # 106 筆事件資料
    │   └── timeline.json          # 8 個分期定義
    ├── scripts/
    │   └── validate-events.mjs    # 資料驗證腳本（npm run test:data）
    └── src/app/
        ├── store/                 # NgRx actions / reducers / selectors
        ├── services/              # EventService / TimelineService / QuizService
        ├── map-container/         # Leaflet 地圖元件
        ├── timeline/              # 時間軸元件
        ├── event-sidebar/         # 事件詳情與測驗側邊欄
        ├── search-bar/            # 搜尋列
        └── layer-control/         # 圖層切換面板
```

---

## 快速開始

```bash
# 1. 複製並進入專案
git clone https://github.com/raybird/cap-map.git
cd cap-map/webapp

# 2. 安裝相依套件
npm install

# 3. 啟動開發伺服器（http://localhost:4200）
npm start

# 4. 驗證事件資料完整性
npm run test:data
```

---

## 部署

推送至 `main` 分支後，GitHub Actions 自動建置並發布至 GitHub Pages：

- **網址**：`https://raybird.github.io/cap-map/`
- **工作流**：`.github/workflows/deploy.yml`

> **首次啟用**：至儲存庫 **Settings → Pages → Build and deployment**，將 Source 設為 **GitHub Actions**。

---

## 🔗 相關專案 (Related Projects)

| 專案 | 簡介 |
|------|------|
| [⚔️ three-kingdoms-map](https://github.com/raybird/three-kingdoms-map) | 專為三國歷史愛好者設計的互動式時空地圖，涵蓋東漢末年至三國統一期間的史詩級歷史戰役、政治事件與人物軌跡。 |
| [⚔️ jymap](https://github.com/raybird/jymap) | 將金庸十五部小說的傳奇故事，交織在同一張互動地圖上，看見江湖隨朝代變遷。 |


---
