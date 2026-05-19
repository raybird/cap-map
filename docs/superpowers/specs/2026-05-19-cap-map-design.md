# CAP-Map 國中會考時空地圖 設計規格書

## 專案概述

CAP-Map 是一個專為國中生設計的互動式學習網站，旨在幫助學生準備臺灣國中會考社會科科目。透過結合歷史時間軸與地理空間，建立立體史觀，並強化會考必考的圖表與地圖判讀能力。

本專案將直接參考並延伸 [jymap](https://github.com/raybird/jymap) 的實作方式，利用其成熟的時空地圖架構作為基礎，以減少探索時間並確保技術實作的可行性。我們將保留 jymap 的核心概念（Leaflet 地圖、時間軸同步、事件卡片等），同時針對國中會考需求進行教育化增強。

## 架構與元件設計

### 系統架構概述

CAP-Map 直接基於 jymap 的已驗證架構，採用單頁應用程式（SPA）設計，基於 Angular 18 框架，利用 NgRx 進行狀態管理。系統架構與 jymap 高度相似，主要分為以下幾個層次：

1. **Presentation Layer (UI)**: 使用 Angular 元件與 Angular Material 建構響應式介面（參考 jymap 的 UI 實作）
2. **Application State Layer**: 透過 NgRx Store 管理應用程式狀態（直接沿用 jymap 的狀態管理模式）
3. **Data Access Layer**: 處理靜態資料載入與處理（採用 JSON 檔案，參考 jymap 的 events.json 與 timeline.json 結構）
4. **Service Layer**: 提供資料處理、地圖操作與時間軸控制服務（基於 jymap 的服務實作進行修改）

### 核心元件

直接延伸自 jymap 的元件結構，我們將實作以下核心元件並針對教育需求進行增強：

1. **MapContainerComponent**: 主要地圖顯示區域，基於 Leaflet（直接參考 jymap 的實作）
2. **TimelineComponent**: 底部可拖曳時間軸，控制地圖顯示的歷史時期（參考 jymap 的時間軸同步機制）
3. **EventSidebarComponent**: 側邊彈出面板，顯示點擊地圖標記的事件詳情（增強為包含考點資訊）
4. **SearchBarComponent**: 頂部搜尋列，支援模糊搜尋歷史事件與地點（使用 Fuse.js，參考 jymap 的搜尋實作）
5. **LayerControlComponent**: 地圖圖層切換控制（地形、氣候、政治邊界等，參考 jymap 的圖層系統）
6. **ExamModeComponent**: 會考練習模式專用介面（教育增強功能）
7. **ProgressTrackerComponent**: 學習進度追蹤與成就系統（教育增強功能）

### 資料流設計

1. 使用者透過 TimelineComponent 選擇歷史時期
2. TimelineComponent 透過 NgRx Action 更新應用程式狀態中的當前時間
3. MapContainerComponent 訂閱時間狀態變化，過濾並顯示對應時期的地圖標記
4. 使用者點擊地圖標記時，觸發事件顯示在 EventSidebarComponent
5. 使用者在 SearchBarComponent 輸入關鍵字時，透過 Fuse.js 進行模糊搜尋
6. LayerControlComponent 允許切換不同的地圖圖層（地形、氣候等）

## 資料模型與內容結構

### 事件資料結構 (events.json)

```json
{
  "events": [
    {
      "id": "unique_identifier",
      "title": "事件標題",
      "description": "詳細事件描述",
      "date": {
        "start": "YYYY-MM-DD",
        "end": "YYYY-MM-DD (optional)",
        "period": "歷史时期名称如『荷西時期』"
      },
      "location": {
        "name": "地點名稱",
        "coordinates": [latitude, longitude],
        "adminDivisions": ["縣市", "區域"]
      },
      "categories": ["歷史", "地理", "公民"],
      "keywords": ["關鍵字1", "關鍵字2"],
      "relatedEvents": ["related_event_id_1", "related_event_id_2"],
      "examRelevance": {
        "importance": "high/medium/low",
        "questionTypes": ["圖表判讀", "概念解釋", "原因分析"],
        "textbookReferences": ["社會科七年級上冊 第3章"]
      },
      "media": {
        "images": ["image_url_1"],
        "maps": ["historical_map_url"]
      }
    }
  ]
}
```

### 時間軸資料結構 (timeline.json)

```json
{
  "periods": [
    {
      "id": "prehistory",
      "label": "史前時代",
      "startDate": "-5000-01-01",
      "endDate": "-300-01-01",
      "color": "#8B4513",
      "description": "臺灣史前時代至金屬器時代"
    },
    {
      "id": "dutch-spanish",
      "label": "荷西時期",
      "startDate": "1624-01-01",
      "endDate": "1662-01-01",
      "color": "#FF6B6B",
      "description": "荷蘭與西班牙在臺灣的殖民統治"
    }
    // 更多歷史時期...
  ]
}
```

### 地理圖層資料結構

1. **地形圖層**: 基於等高線資料的向量圖層
2. **氣候圖層**: 季風、降水量、溫度分布的 raster 圖層
3. **政治邊界圖層:** 不同時期的行政區劃變化
4. **經濟發展圖層:** 產業分布、交通網路等主題圖層

## 教育功能與考試準備工具

### 學習模式

1. **探索模式 (Default)**: 自由瀏覽時空地圖，點擊事件學習
2. **會考模式**: 
   - 主題專項練習（如「臺灣發展史」「東亞關係」「世界文明」）
   - 時間限制答題模擬
   - 圖表與地圖判讀專項練習
3. **挑戰模式**: 
   - 時間競賽：在限定時間內找出特定歷史事件位置
   - 主題連結：根據提示找出相關事件間的地理關係

### 進度追蹤與評估

1. **知識點掌握度**: 追蹤每個歷史事件的學習與複習次數
2. **能力分析**: 根據答題表現分析在圖表判讀、時間序列理解、地理空間思維等方面的強弱
3. **學習建議**: 根據薄弱環節提供個人化學習建議
4. **成就系統**: 完成特定學習目標解鎖徽章與成就

### 課程對應

1. **教科書對應**: 事件與概念直接對應國中社會科教科書章節
2. **考點標記**: 每個事件標註其在會考中的出現頻率與題型
3. **橫向連結**: 強調不同學習領域（史、地、公）間的關聯性
4. **時效更新**: 定期更新內容以反映最新會考趨勢與課程調整

## 技術實作規劃

### 開發階段

**階段 1: 核心功能 (Weeks 1-3)**
- 建置基本 Angular 18 專案結構
- 實作 Leaflet 地圖顯示與基本互動
- 建立時間軸元件與同步機制
- 載入第一階段臺灣史地資料（約50個關鍵事件）

**階段 2: 教育功能 (Weeks 4-5)**
- 實作事件詳情側邊欄
- 新增搜尋功能（Fuse.js 整合）
- 建立會考練習模式基本框架
- 實作基本進度追蹤

**階段 3: 進階功能與優化 (Weeks 6-7)**
- 地圖圖層切換功能（地形、氣候等）
- 響應式設計優化（平板與手機適配）
- 進階考試功能（計時模式、錯誤本等）
- 效能優化與載入速度改善

**階段 4: 內容擴充與測試 (Weeks 8-9)**
- 擴充事件資料庫（目標：200+ 個關鍵事件）
- 使用者測試與回饋整合
- 錯誤修復與穩定性提升
- 準備發布

### 技術細節

1. **狀態管理**: NgRx Store 用於管理應用程式狀態（當前時間、選取事件、地圖狀態等）
2. **地圖庫**: Leaflet 與適當的外掛（Leaflet.label、Leaflet.markercluster 等）
3. **搜尋引擎**: Fuse.js 進行模糊搜尋，優化行動裝置體驗
4. **樣式框架**: Angular Material 提供一致的 UI 元件與響應式設計
5. **狀態持續性**: 使用 localStorage 保存學習進度與偏好設定
6. **離線支援**: Service Worker 基礎快取，提升重複載入速度

### 部署策略

- 使用 Cloudflare Pages 進行靜態網站部署
- 設定自動化構建與部署流程
- 實施版本控制與回滾機制
- 監控效能指標與使用者體驗

## 結論

CAP-Map 透過結合 jymap 成功的時空地圖概念與臺灣國中會考社會科的特殊需求，創造了一個創新的學習工具。該設計強調：

1. **歷史地理整合**: 透過時空關聯幫助學生建立完整的歷史觀
2. **會考導向**: 直接對應考試重點與題型，提升應試效能
3. **互動體驗**: 利用現代網頁技術提供流暢、吸引人的學習介面
4. **個人化學習**: 透過進度追蹤與智能建議提升學習效率
5. **跨科整合**: 結合歷史、地理與公民學科的知識

此設計將在取得您的確認後進入實作階段，採用迭代開發方式確保最終產品符合教育需求與使用者期望。