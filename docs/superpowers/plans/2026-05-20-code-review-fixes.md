# cap-map 審查問題修復計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復程式碼審查中發現的所有問題，包含 3 個嚴重 bug、4 個建議修正及 2 個程式品質改善。

**Architecture:** 按依賴關係排序修復。先定義型別模型（其他任務的基礎），再修正資料載入（核心功能），然後修正元件層 bug（marker、subscription leak），最後改善程式品質（側效、互動邏輯、顯示）。

**Tech Stack:** Angular 20, NgRx 21, Leaflet, Fuse.js, TypeScript, Karma/Jasmine

所有指令請在 `webapp/` 目錄下執行。

---

### Task 1：定義 TypeScript 資料模型

**Files:**
- Create: `webapp/src/app/models/event.model.ts`
- Create: `webapp/src/app/models/timeline.model.ts`
- Modify: `webapp/src/app/services/event.service.ts`
- Modify: `webapp/src/app/services/timeline.service.ts`

- [ ] **Step 1：建立 `event.model.ts`**

```typescript
// webapp/src/app/models/event.model.ts
export interface EventLocation {
  name: string;
  coordinates: [number, number]; // [lat, lng]
  adminDivisions: string[];
}

export interface EventDate {
  start: string;
  end: string;
  period: string;
  periodId: string;
}

export interface ExamRelevance {
  importance: 'high' | 'medium' | 'low';
  questionTypes: string[];
  textbookReferences: string[];
}

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  date: EventDate;
  location: EventLocation;
  categories: string[];
  keywords: string[];
  relatedEvents: string[];
  examRelevance: ExamRelevance;
}
```

- [ ] **Step 2：建立 `timeline.model.ts`**

```typescript
// webapp/src/app/models/timeline.model.ts
export interface TimelinePeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}
```

- [ ] **Step 3：更新 `EventService` 使用 `HistoricalEvent` 型別**

將 `webapp/src/app/services/event.service.ts` 改為：

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as EventActions from '../store/actions/event.actions';
import { HistoricalEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsDataUrl = 'assets/data/events.json';

  constructor(private http: HttpClient, private store: Store<AppState>) {}

  loadEvents(): void {
    this.store.dispatch(EventActions.loadEvents());

    this.http.get<HistoricalEvent[]>(this.eventsDataUrl).subscribe({
      next: (events) => {
        this.store.dispatch(EventActions.loadEventsSuccess({ events }));
      },
      error: (error) => {
        this.store.dispatch(EventActions.loadEventsFailure({
          error: error.message || 'Failed to load events data'
        }));
      }
    });
  }
}
```

- [ ] **Step 4：更新 `TimelineService` 使用 `TimelinePeriod` 型別**

將 `webapp/src/app/services/timeline.service.ts` 改為：

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as TimelineActions from '../store/actions/timeline.actions';
import { TimelinePeriod } from '../models/timeline.model';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private timelineDataUrl = 'assets/data/timeline.json';

  constructor(private http: HttpClient, private store: Store<AppState>) {}

  loadTimelinePeriods(): void {
    this.store.dispatch(TimelineActions.loadTimelinePeriods());

    this.http.get<TimelinePeriod[]>(this.timelineDataUrl).subscribe({
      next: (periods) => {
        this.store.dispatch(TimelineActions.loadTimelinePeriodsSuccess({ periods }));
      },
      error: (error) => {
        this.store.dispatch(TimelineActions.loadTimelinePeriodsFailure({
          error: error.message || 'Failed to load timeline data'
        }));
      }
    });
  }
}
```

- [ ] **Step 5：確認編譯無錯誤**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Build at: ... - Hash: ... - Time: ...ms`（無 ERROR 字樣）

- [ ] **Step 6：Commit**

```bash
git add webapp/src/app/models/ webapp/src/app/services/
git commit -m "feat: add TypeScript models for HistoricalEvent and TimelinePeriod"
```

---

### Task 2：修正資料永遠無法載入（🔴 嚴重）

**問題根源：** `EventService.loadEvents()` 與 `TimelineService.loadTimelinePeriods()` 從未被呼叫。各元件只 dispatch action，但 `AppModule` 沒有 `EffectsModule`，reducer 收到 action 只設定 `loading: true`，HTTP 呼叫從未發生。

**修正策略：** 在 `AppComponent.ngOnInit()` 集中呼叫兩個 service 一次，並移除各子元件內重複的 dispatch。

**Files:**
- Modify: `webapp/src/app/app.component.ts`
- Modify: `webapp/src/app/timeline/timeline.component.ts`
- Modify: `webapp/src/app/search-bar/search-bar.component.ts`

- [ ] **Step 1：更新 `AppComponent` 注入並呼叫兩個 service**

將 `webapp/src/app/app.component.ts` 改為：

```typescript
import { Component, OnInit } from '@angular/core';
import { EventService } from './services/event.service';
import { TimelineService } from './services/timeline.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cap-map';
  showExamMode = false;

  constructor(
    private eventService: EventService,
    private timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    this.eventService.loadEvents();
    this.timelineService.loadTimelinePeriods();
  }

  toggleExamMode(): void {
    this.showExamMode = !this.showExamMode;
  }
}
```

- [ ] **Step 2：移除 `TimelineComponent` 中的重複 dispatch**

找到 `webapp/src/app/timeline/timeline.component.ts` 的 `ngOnInit()`，將：

```typescript
ngOnInit(): void {
  this.store.dispatch(TimelineActions.loadTimelinePeriods());
  this.store.dispatch(EventActions.loadEvents());

  this.periods$ = this.store.select(selectPeriods);
```

改為：

```typescript
ngOnInit(): void {
  this.periods$ = this.store.select(selectPeriods);
```

同時移除不再需要的 import（若只用在已刪除的 dispatch 上）：

```typescript
// 移除這行（若 EventActions 在此檔案其他地方仍有使用則保留）
import * as EventActions from '../store/actions/event.actions';
```

> 確認 `EventActions` 是否仍在 `onEventClick()` 中使用（有 → 保留 import，無 → 刪除）。
> 目前 `onEventClick()` 只 dispatch `EventActions.selectEvent()`，所以保留 import。

更新後完整的 `ngOnInit()`：

```typescript
ngOnInit(): void {
  this.periods$ = this.store.select(selectPeriods);
  this.currentPeriodId$ = this.store.select(selectCurrentPeriodId);
  this.loading$ = this.store.select(selectTimelineLoading);
  this.error$ = this.store.select(selectTimelineError);

  this.events$ = combineLatest([
    this.store.select(selectEvents),
    this.store.select(selectCurrentPeriodId)
  ]).pipe(
    map(([events, periodId]) => {
      if (!events) return [];
      const filtered = !periodId
        ? events
        : events.filter((e: any) => e.date?.periodId === periodId || !e.date?.periodId);
      this.store.dispatch(MapActions.setMapEvents({ events: filtered }));
      return filtered;
    })
  );
}
```

- [ ] **Step 3：移除 `SearchBarComponent` 中的重複 dispatch**

找到 `webapp/src/app/search-bar/search-bar.component.ts` 的 `ngOnInit()`，將：

```typescript
ngOnInit(): void {
  this.store.dispatch(EventActions.loadEvents());

  this.events$ = this.store.select(EventSelectors.selectEvents);
```

改為：

```typescript
ngOnInit(): void {
  this.events$ = this.store.select(EventSelectors.selectEvents);
```

同時移除不再需要的 import：

```typescript
// 刪除這行（EventActions 在此檔案其他地方不再使用）
import * as EventActions from '../store/actions/event.actions';
```

- [ ] **Step 4：啟動 dev server 並確認資料載入**

```bash
npm start
```

開啟 `http://localhost:4200`，確認：
- 地圖上出現紅色圓形標記（約 33 個）
- 時間軸底部出現彩色時期色帶（8 個）
- 搜尋「荷蘭」可看到結果

- [ ] **Step 5：Commit**

```bash
git add webapp/src/app/app.component.ts webapp/src/app/timeline/timeline.component.ts webapp/src/app/search-bar/search-bar.component.ts
git commit -m "fix: wire AppComponent to call services on init and remove duplicate event dispatches"
```

---

### Task 3：修正 Marker 高亮無效（🔴 嚴重）

**問題根源：** `MapContainerComponent.highlightMarker()` 透過 `(layer as any)._eventId` 比對 marker，但 `updateEventMarkers()` 建立 marker 時從未設定 `_eventId` 屬性，導致點擊側邊欄或搜尋選取事件時，地圖標記永遠不會高亮。

**Files:**
- Modify: `webapp/src/app/map-container/map-container.component.ts`

- [ ] **Step 1：在 `updateEventMarkers()` 中設定 `_eventId`**

找到 `webapp/src/app/map-container/map-container.component.ts` 的 `updateEventMarkers()`，將：

```typescript
events.forEach(event => {
  if (event.location && event.location.coordinates) {
    const [lat, lng] = event.location.coordinates;
    const marker = L.marker([lat, lng], { icon: this.createInkIcon() });

    const popupContent = `<div class="marker-popup">
      <h3>${event.title}</h3>
      <p>${event.date?.start || ''} ${event.location?.name || ''}</p>
    </div>`;
    marker.bindPopup(popupContent);

    marker.on('click', () => {
```

改為：

```typescript
events.forEach(event => {
  if (event.location && event.location.coordinates) {
    const [lat, lng] = event.location.coordinates;
    const marker = L.marker([lat, lng], { icon: this.createInkIcon() });
    (marker as any)._eventId = event.id;

    const popupContent = `<div class="marker-popup">
      <h3>${event.title}</h3>
      <p>${event.date?.start || ''} ${event.location?.name || ''}</p>
    </div>`;
    marker.bindPopup(popupContent);

    marker.on('click', () => {
```

- [ ] **Step 2：確認 `highlightMarker()` 的呼叫對象正確**

確認 `setupEventListeners()` 中訂閱的是 `selectSelectedEventId` 且呼叫 `highlightMarker`：

```typescript
const selectedEventSub = this.store.select(selectSelectedEventId).subscribe(eventId => {
  this.highlightMarker(eventId);
});
```

若目前呼叫的是其他方法名稱，改為 `highlightMarker(eventId)`。

- [ ] **Step 3：手動驗證高亮行為**

啟動 `npm start`，執行以下步驟確認修復：
1. 在搜尋欄輸入「荷蘭」
2. 點擊搜尋結果「荷蘭建熱蘭遮城」
3. 確認側邊欄開啟的同時，地圖上對應位置的標記有 `selected-marker` class（可透過 Chrome DevTools 確認）

- [ ] **Step 4：Commit**

```bash
git add webapp/src/app/map-container/map-container.component.ts
git commit -m "fix: set _eventId on Leaflet markers to enable highlight on selection"
```

---

### Task 4：修正 LayerControl 訂閱記憶體洩漏（🔴 嚴重）

**問題根源：** `isLayerActive()` 在 template 的 `[checked]="isLayerActive(layer.id)"` 中被呼叫。Angular 每次 change detection 都會呼叫這個方法，每次都建立一個新的 `Subscription` 並 push 進 `subscriptions` 陣列，導致訂閱無限累積。

**修正策略：** 改用 `async pipe` 搭配 `activeLayers$`，在 template 中直接做 `includes()` 判斷，完全不需要 `isLayerActive()` 方法。

**Files:**
- Modify: `webapp/src/app/layer-control/layer-control.component.ts`
- Modify: `webapp/src/app/layer-control/layer-control.component.html`

- [ ] **Step 1：更新 `LayerControlComponent` 移除 `isLayerActive()` 方法**

將 `webapp/src/app/layer-control/layer-control.component.ts` 改為：

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as MapActions from '../store/actions/map.actions';
import * as MapSelectors from '../store/selectors/map.selectors';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.css'],
  standalone: false
})
export class LayerControlComponent implements OnInit {
  activeLayers$!: Observable<string[]>;
  isOpen = false;

  availableLayers = [
    { id: 'terrain', name: '地形圖', description: '顯示海拔和地形資訊' },
    { id: 'climate', name: '氣候圖', description: '顯示雨量與溫度分布' },
    { id: 'boundaries', name: '行政區劃', description: '顯示各時期行政界線變化' },
    { id: 'economy', name: '經濟發展', description: '顯示產業與資源分布' },
    { id: 'population', name: '人口分布', description: '顯示歷史人口密度與遷移' },
    { id: 'transportation', name: '交通網絡', description: '顯示歷史路線與港口' }
  ];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.activeLayers$ = this.store.select(MapSelectors.selectMapActiveLayers);
  }

  toggleLayer(layerId: string): void {
    this.store.dispatch(MapActions.toggleMapLayer({ layerId }));
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }
}
```

- [ ] **Step 2：更新 template 使用 `async pipe`**

將 `webapp/src/app/layer-control/layer-control.component.html` 改為：

```html
<div class="layer-toggle" (click)="togglePanel()" [class.active]="isOpen" title="圖層控制">
  <span class="layer-icon">🗺</span>
</div>

<div class="layer-panel" *ngIf="isOpen" [class.open]="isOpen">
  <div class="panel-header">
    <h4>地圖圖層</h4>
    <button class="close-btn" (click)="togglePanel()">×</button>
  </div>
  <div class="panel-body">
    <ng-container *ngIf="activeLayers$ | async as activeLayers">
      <div class="layer-item" *ngFor="let layer of availableLayers">
        <label class="layer-label">
          <input type="checkbox"
                 [checked]="activeLayers.includes(layer.id)"
                 (change)="toggleLayer(layer.id)">
          <span class="layer-name">{{ layer.name }}</span>
        </label>
        <div class="layer-desc">{{ layer.description }}</div>
      </div>
    </ng-container>
  </div>
</div>
```

- [ ] **Step 3：確認圖層面板運作正常**

啟動 `npm start`，點擊右下角的 🗺 圖示，確認：
- 面板正常開關
- 各圖層 checkbox 的勾選狀態正確
- 切換 checkbox 後狀態保持（不因 change detection 重置）

- [ ] **Step 4：Commit**

```bash
git add webapp/src/app/layer-control/layer-control.component.ts webapp/src/app/layer-control/layer-control.component.html
git commit -m "fix: replace isLayerActive subscription loop with async pipe to fix memory leak"
```

---

### Task 5：修正 Observable map() 內的 Side Effect（🟡 建議）

**問題根源：** `TimelineComponent.events$` 的 `map()` 內直接 dispatch NgRx action。`map()` 應為純函式，副作用應使用 `tap()`。

**Files:**
- Modify: `webapp/src/app/timeline/timeline.component.ts`

- [ ] **Step 1：將 dispatch 從 `map()` 移至 `tap()`**

找到 `webapp/src/app/timeline/timeline.component.ts` 中 `ngOnInit()` 的 `events$` 定義，將：

```typescript
this.events$ = combineLatest([
  this.store.select(selectEvents),
  this.store.select(selectCurrentPeriodId)
]).pipe(
  map(([events, periodId]) => {
    if (!events) return [];
    const filtered = !periodId
      ? events
      : events.filter((e: any) => e.date?.periodId === periodId || !e.date?.periodId);
    this.store.dispatch(MapActions.setMapEvents({ events: filtered }));
    return filtered;
  })
);
```

改為：

```typescript
this.events$ = combineLatest([
  this.store.select(selectEvents),
  this.store.select(selectCurrentPeriodId)
]).pipe(
  map(([events, periodId]) => {
    if (!events) return [];
    return !periodId
      ? events
      : events.filter((e: any) => e.date?.periodId === periodId || !e.date?.periodId);
  }),
  tap(filtered => this.store.dispatch(MapActions.setMapEvents({ events: filtered })))
);
```

- [ ] **Step 2：確認 `tap` 已從 rxjs/operators 匯入**

在檔案頂端確認 import：

```typescript
import { map, tap } from 'rxjs/operators';
```

若原本只有 `import { map } from 'rxjs/operators'`，加上 `tap`。

- [ ] **Step 3：確認時期篩選功能正常**

啟動 `npm start`，在時間軸點擊「荷西時期」色帶，確認地圖只顯示該時期的事件標記。

- [ ] **Step 4：Commit**

```bash
git add webapp/src/app/timeline/timeline.component.ts
git commit -m "refactor: move NgRx dispatch from map() to tap() in timeline events stream"
```

---

### Task 6：新增時期篩選的取消選取功能（🟡 建議）

**問題根源：** 點擊時期色帶後沒有辦法回到「顯示全部」，唯一方式是重新整理頁面。

**修正策略：** 在 `setCurrentPeriod` action 接受 `string | null`，點擊已選取的時期時 dispatch `null` 來清除篩選。

**Files:**
- Modify: `webapp/src/app/store/actions/timeline.actions.ts`
- Modify: `webapp/src/app/store/reducers/timeline.reducer.ts`
- Modify: `webapp/src/app/timeline/timeline.component.ts`

- [ ] **Step 1：更新 `setCurrentPeriod` action 接受 `null`**

將 `webapp/src/app/store/actions/timeline.actions.ts` 中的 `setCurrentPeriod` 改為：

```typescript
export const setCurrentPeriod = createAction(
  '[Timeline] Set Current Period',
  props<{ periodId: string | null }>()
);
```

- [ ] **Step 2：確認 reducer 已能處理 `null`（目前已正確）**

確認 `webapp/src/app/store/reducers/timeline.reducer.ts` 的 `setCurrentPeriod` handler：

```typescript
on(TimelineActions.setCurrentPeriod, (state, { periodId }) => ({
  ...state,
  currentPeriodId: periodId  // string | null 都能接受
})),
```

`currentPeriodId` 的型別已是 `string | null`，無需修改 reducer。

- [ ] **Step 3：更新 `TimelineComponent.onPeriodClick()` 實作 toggle 邏輯**

找到 `webapp/src/app/timeline/timeline.component.ts` 的 `onPeriodClick()`，將：

```typescript
onPeriodClick(period: any): void {
  this.store.dispatch(TimelineActions.setCurrentPeriod({ periodId: period.id }));
}
```

改為：

```typescript
onPeriodClick(period: any): void {
  this.currentPeriodId$.pipe(first()).subscribe(currentId => {
    const nextId = currentId === period.id ? null : period.id;
    this.store.dispatch(TimelineActions.setCurrentPeriod({ periodId: nextId }));
  });
}
```

- [ ] **Step 4：確認 `first` 已從 rxjs 匯入**

在 `timeline.component.ts` 頂端確認：

```typescript
import { Subscription, Observable, combineLatest, first } from 'rxjs';
```

若原本沒有 `first`，加入。

- [ ] **Step 5：確認 toggle 行為**

啟動 `npm start`：
1. 點擊「清治時期」→ 地圖只顯示清治時期事件，色帶有 active 樣式
2. 再次點擊「清治時期」→ 地圖顯示所有事件，色帶 active 樣式消失

- [ ] **Step 6：Commit**

```bash
git add webapp/src/app/store/actions/timeline.actions.ts webapp/src/app/timeline/timeline.component.ts
git commit -m "feat: allow clicking active period again to clear filter and show all events"
```

---

### Task 7：修正序列測驗題的邏輯錯誤（🟡 建議）

**問題根源：** `buildSequenceQuestion()` 取 `relatedEvents[0]` 作為「緊接著的事件」，但 `relatedEvents` 儲存的是相關事件 ID，沒有時序意義。正確做法是找到比當前事件晚發生、且時間最近的事件。

**Files:**
- Modify: `webapp/src/app/services/quiz.service.ts`

- [ ] **Step 1：更新 `buildSequenceQuestion()` 使用時序查找**

找到 `webapp/src/app/services/quiz.service.ts` 的 `buildSequenceQuestion()`，將整個方法改為：

```typescript
private buildSequenceQuestion(event: any, allEvents: any[]): QuizQuestion | null {
  const eventYear = parseInt(event.date?.start?.split('-')[0] ?? '0', 10);

  // 找出所有時間比當前事件晚的事件，取最近的一個
  const candidates = allEvents
    .filter(e => e.id !== event.id)
    .map(e => ({ event: e, year: parseInt(e.date?.start?.split('-')[0] ?? '0', 10) }))
    .filter(({ year }) => year > eventYear)
    .sort((a, b) => a.year - b.year);

  if (candidates.length === 0) return null;
  const nextEvent = candidates[0].event;
  const correct = nextEvent.title;

  const others: string[] = allEvents
    .filter(e => e.id !== event.id && e.id !== nextEvent.id)
    .slice(0, 3)
    .map(e => e.title);

  if (others.length < 3) return null;

  return {
    id: `sequence-${event.id}`,
    type: 'sequence',
    question: `「${event.title}」之後緊接著發生的是哪個事件？`,
    options: this.shuffle([...others, correct]),
    correctAnswer: correct
  };
}
```

- [ ] **Step 2：驗證測驗邏輯正確性**

啟動 `npm start`，點擊地圖上的任意事件，在側邊欄的「隨堂測驗」中找到序列題（題型為「之後緊接著」），確認答案選項在時序上合理。

- [ ] **Step 3：Commit**

```bash
git add webapp/src/app/services/quiz.service.ts
git commit -m "fix: sequence quiz now finds chronologically next event instead of using relatedEvents[0]"
```

---

### Task 8：修正相關事件顯示 ID 而非標題（🟢 改善）

**問題根源：** `event-sidebar.component.html` 的「相關事件」區塊直接顯示 `relId`（字串 ID），使用者看到 `"dutch-zeelandia"` 這類原始 ID。`EventSidebarComponent` 已有 `allEvents` 陣列，可直接查找標題。

**Files:**
- Modify: `webapp/src/app/event-sidebar/event-sidebar.component.ts`
- Modify: `webapp/src/app/event-sidebar/event-sidebar.component.html`

- [ ] **Step 1：在 `EventSidebarComponent` 新增 `getEventTitle()` 方法**

在 `webapp/src/app/event-sidebar/event-sidebar.component.ts` 末尾，在 `closeSidebar()` 之前加入：

```typescript
getEventTitle(id: string): string {
  return this.allEvents.find(e => e.id === id)?.title ?? id;
}
```

- [ ] **Step 2：更新 template 顯示標題**

找到 `webapp/src/app/event-sidebar/event-sidebar.component.html` 的相關事件區塊，將：

```html
<div class="related-item" *ngFor="let relId of event.relatedEvents">
  <span class="rel-title">{{ relId }}</span>
</div>
```

改為：

```html
<div class="related-item" *ngFor="let relId of event.relatedEvents">
  <span class="rel-title">{{ getEventTitle(relId) }}</span>
</div>
```

- [ ] **Step 3：確認顯示正確**

啟動 `npm start`，點擊「長濱文化」事件，確認側邊欄「相關事件」顯示「卑南文化」而非 `"peinan-culture"`。

- [ ] **Step 4：Commit**

```bash
git add webapp/src/app/event-sidebar/event-sidebar.component.ts webapp/src/app/event-sidebar/event-sidebar.component.html
git commit -m "fix: display related event titles instead of raw IDs in event sidebar"
```

---

### Task 9：清除未使用的程式碼（🟢 改善）

**Files:**
- Modify: `webapp/src/app/map-container/map-container.component.ts`
- Delete: `webapp/src/app/app.ts`

- [ ] **Step 1：移除 `MapContainerComponent` 的未使用 import**

找到 `webapp/src/app/map-container/map-container.component.ts` 第一行，將：

```typescript
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
```

改為：

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
```

同時移除未使用的 store import。確認目前實際使用的 import 列表：
- `selectMapEvents` ✓（`setupEventListeners` 中使用）
- `selectSelectedEventId` ✓（`setupEventListeners` 中使用）
- `selectMapActiveLayers` ✗（無任何使用 → 移除）
- `clearSelectedEvent` ✗（無任何使用 → 移除）
- `Observable` ✗（無任何使用 → 移除）

更新後的完整 import：

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectEvent } from '../store/actions/map.actions';
import * as EventActions from '../store/actions/event.actions';
import { selectMapEvents, selectSelectedEventId } from '../store/selectors/map.selectors';
import { Subscription } from 'rxjs';
```

- [ ] **Step 2：刪除未使用的 `app.ts`**

```bash
rm webapp/src/app/app.ts
```

> `app.ts` 定義了一個 standalone `App` 元件，但 `AppModule` 的 bootstrap 使用 `AppComponent`（`app.component.ts`），`app.ts` 從未被任何地方 import。

- [ ] **Step 3：確認編譯無錯誤**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: 編譯成功，無 ERROR。

- [ ] **Step 4：Commit**

```bash
git add webapp/src/app/map-container/map-container.component.ts
git rm webapp/src/app/app.ts
git commit -m "chore: remove unused imports from MapContainerComponent and delete orphaned app.ts"
```

---

## 完成驗收清單

所有 Task 完成後，執行以下最終驗收：

- [ ] `ng build` 產生 production build 無 ERROR
- [ ] `npm start` 啟動後，地圖顯示 33 個事件標記
- [ ] 時間軸顯示 8 個時期色帶
- [ ] 點擊地圖標記 → 側邊欄開啟且對應標記出現高亮
- [ ] 搜尋事件 → 點擊結果 → 地圖標記高亮且側邊欄開啟
- [ ] 點擊時期色帶 → 事件篩選；再次點擊 → 恢復全部
- [ ] 開啟圖層控制面板 → 多次開關不造成 console 記憶體警告
- [ ] 側邊欄「相關事件」顯示中文標題而非 ID
- [ ] 側邊欄測驗的「緊接著哪個事件」答案在時序上正確
