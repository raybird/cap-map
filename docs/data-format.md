# 資料格式說明：events.json 與 timeline.json

本文件說明 cap-map 應用程式的兩份核心資料檔格式、欄位意義，以及它們如何共同驅動地圖與時間軸的顯示。

---

## 架構概覽

```
timeline.json   →  定義時間軸的「分期」（色帶）
events.json     →  定義標記在地圖與時間軸上的「事件」
```

兩者透過 `periodId` 欄位關聯：每個事件都屬於 `timeline.json` 中的某個分期。時間軸元件讀取當前分期，篩選出同一 `periodId` 的事件，再同步推送至地圖顯示。

---

## timeline.json

存放路徑：`public/assets/data/timeline.json`

每筆資料代表一個**歷史分期**，在時間軸上呈現為帶有顏色的色帶。

### 格式

```json
[
  {
    "id": "prehistory",
    "label": "史前時代",
    "startDate": "-5000-01-01",
    "endDate": "-1000-01-01",
    "startYear": -5000,
    "endYear": -1000,
    "color": "#8B4513",
    "description": "史前文化與早期聚落發展"
  }
]
```

### 欄位說明

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | ✓ | 唯一識別碼，供 events.json 的 `periodId` 對應 |
| `label` | string | ✓ | 顯示在時間軸色帶上的名稱 |
| `startDate` | string | ✓ | ISO 8601 日期，公元前以負號表示（如 `-5000-01-01`） |
| `endDate` | string | ✓ | 同上 |
| `startYear` | number | ✓ | 整數年份，公元前為負值，用於像素位置計算 |
| `endYear` | number | ✓ | 同上 |
| `color` | string | ✓ | 十六進位色碼，決定色帶與事件點的顯示顏色 |
| `description` | string | | 分期的簡短說明 |

### 注意事項

- `startYear` / `endYear` 是實際用於計算像素位置的欄位（`pixelX = (year - minYear) * pixelsPerYear`），`startDate` / `endDate` 目前為備用欄位。
- 分期順序建議依時間先後排列，但不強制。
- 相鄰分期的 `endYear` 與 `startYear` 不需完全接續，時間軸不會強制填滿空白。

---

## events.json

存放路徑：`public/assets/data/events.json`

每筆資料代表一個**歷史事件**，顯示為地圖上的標記與時間軸上的事件點。

### 格式

```json
[
  {
    "id": "changbin-culture",
    "title": "長濱文化",
    "description": "臺灣目前發現最早的舊石器時代文化...",
    "date": {
      "start": "-50000-01-01",
      "end": "-5000-01-01",
      "period": "史前時代",
      "periodId": "prehistory"
    },
    "location": {
      "name": "八仙洞（臺東縣長濱鄉）",
      "coordinates": [23.375, 121.452],
      "adminDivisions": ["臺東縣", "長濱鄉"]
    },
    "categories": ["歷史", "地理"],
    "keywords": ["舊石器時代", "八仙洞", "長濱文化", "打製石器"],
    "relatedEvents": ["peinan-culture"],
    "examRelevance": {
      "importance": "high",
      "questionTypes": ["圖表判讀", "概念解釋"],
      "textbookReferences": ["社會科七年級上冊 臺灣史"]
    }
  }
]
```

### 欄位說明

#### 頂層

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | ✓ | 唯一識別碼，可供 `relatedEvents` 互相參照 |
| `title` | string | ✓ | 事件名稱，顯示於地圖 tooltip 與側欄標題 |
| `description` | string | ✓ | 事件說明，顯示於側欄 |
| `date` | object | ✓ | 見下方 |
| `location` | object | ✓ | 見下方 |
| `categories` | string[] | | 分類標籤，目前作為搜尋與測驗參考 |
| `keywords` | string[] | | 關鍵字，供 Fuse.js 模糊搜尋（threshold 0.3）使用 |
| `relatedEvents` | string[] | | 關聯事件的 `id` 清單，顯示於側欄的相關事件區塊 |
| `examRelevance` | object | | 見下方 |

#### `date` 物件

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `start` | string | ✓ | 事件開始日期，ISO 8601，公元前以負號表示 |
| `end` | string | | 事件結束日期，同上 |
| `period` | string | | 分期名稱（人類可讀，非程式邏輯依賴） |
| `periodId` | string | ✓ | 對應 `timeline.json` 的 `id`，決定該事件屬於哪個分期 |

> `periodId` 是兩份資料唯一的連結欄位。時間軸切換分期時，系統依此篩選事件。

#### `location` 物件

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✓ | 地點名稱，顯示於側欄 |
| `coordinates` | [number, number] | ✓ | **`[緯度, 經度]`** 格式（非 GeoJSON 的經緯反向順序） |
| `adminDivisions` | string[] | | 行政區劃層級，如 `["臺東縣", "長濱鄉"]` |

#### `examRelevance` 物件

| 欄位 | 型別 | 說明 |
|---|---|---|
| `importance` | `"high"` \| `"medium"` \| `"low"` | 考試重要性，目前用於 QuizService 出題優先序 |
| `questionTypes` | string[] | 題型提示，如 `"圖表判讀"`、`"概念解釋"` |
| `textbookReferences` | string[] | 教科書對應章節 |

---

## 兩者的關聯圖

```
timeline.json                    events.json
─────────────────                ────────────────────────────
{ id: "prehistory", ... }  ←──  { date: { periodId: "prehistory" } }
{ id: "medieval",   ... }  ←──  { date: { periodId: "medieval"   } }
```

使用者點擊時間軸分期 → 系統找出所有 `periodId` 相符的事件 → 推送至地圖顯示

---

## 建立新資料集的最小需求

若要製作一套不同主題的資料集（如世界史、地理主題），需提供：

1. **`timeline.json`**：至少一個分期，包含 `id`、`startYear`、`endYear`、`color`、`label`
2. **`events.json`**：至少一個事件，包含 `id`、`title`、`description`、`date.periodId`、`location.coordinates`

其餘欄位（`keywords`、`examRelevance` 等）可省略，功能會自動降級（搜尋減少索引欄位、測驗題數減少）。

---

## 未來擴充：多路由載入不同資料集

目前應用程式硬碼讀取固定路徑的 JSON 檔。如果未來要讓同一個 map + timeline 殼支援多個主題，建議的方向如下：

### 方案概念

透過 Angular Router 的路由參數，動態決定要載入哪一份資料：

```
/map/taiwan-history   → 讀取 assets/data/taiwan-history/events.json
/map/world-geography  → 讀取 assets/data/world-geography/events.json
/map/japan-history    → 讀取 assets/data/japan-history/events.json
```

每個路由共用同一套元件，僅資料來源不同。

### 所需改動

| 元件 / 服務 | 改動方向 |
|---|---|
| `EventService` | 改為接受路徑參數，動態組合 fetch URL |
| `TimelineService` | 同上 |
| `AppRoutingModule` | 加入 `:dataset` 路由參數 |
| `AppComponent` | 訂閱路由參數，傳入服務 |

### 資料集目錄建議結構

```
public/assets/data/
  taiwan-history/
    events.json
    timeline.json
  world-geography/
    events.json
    timeline.json
```

各資料集只要符合本文件的欄位規格，即可直接掛上現有的地圖與時間軸元件運作，無需修改顯示邏輯。
