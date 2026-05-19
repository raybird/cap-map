# CAP-Map 國中會考時空地圖 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive spatiotemporal map for junior high school social studies exam preparation, adapting the jymap concept with Taiwan-focused content and educational enhancements.

**Architecture:** Based on the validated jymap architecture, CAP-Map uses Angular 18 with NgRx for state management, Leaflet for mapping, and Fuse.js for fuzzy search. The application follows a modular component structure with clear separation between presentation, state, data access, and service layers.

**Tech Stack:** Angular 18, NgRx, Leaflet, Fuse.js, Angular Material, TypeScript, HTML5, CSS3

---

### Task 1: Project Setup and Dependencies

**Files:**
- Create: `package.json`
- Create: `angular.json`
- Create: `tsconfig.json`
- Create: `src/main.ts`
- Create: `src/index.html`
- Create: `src/styles.css`

- [ ] **Step 1: Initialize Angular 18 project**

```bash
ng new cap-map --style=css --routing=false --skip-tests --strict
```

- [ ] **Step 2: Install required dependencies**

```bash
npm install leaflet @types/leaflet fuse.js @ngrx/store @ngrx/effects @angular/material @angular/cdk
```

- [ ] **Step 3: Verify project structure**

Run: `ls -la`
Expected: See Angular project structure with node_modules, src, etc.

- [ ] **Step 4: Commit initial setup**

```bash
git add .
git commit -m "feat: initialize Angular 18 project with dependencies"
```

### Task 2: Core Map Component (MapContainerComponent)

**Files:**
- Create: `src/app/map-container/map-container.component.ts`
- Create: `src/app/map-container/map-container.component.html`
- Create: `src/app/map-container/map-container.component.css`
- Create: `src/app/store/actions/map.actions.ts`
- Create: `src/app/store/reducers/map.reducer.ts`
- Modify: `src/app/store/app.state.ts`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component map-container --skip-tests
```

- [ ] **Step 2: Create NgRx actions for map interactions**

```typescript
import { createAction, props } from '@ngrx/store';

export const setMapEvents = createAction(
  '[Map] Set Events',
  props<{ events: any[] }>()
);

export const selectEvent = createAction(
  '[Map] Select Event',
  props<{ eventId: string }>()
);

export const clearSelectedEvent = createAction(
  '[Map] Clear Selected Event'
);

export const toggleMapLayer = createAction(
  '[Map] Toggle Layer',
  props<{ layerId: string }>()
);
```

- [ ] **Step 3: Create map reducer**

```typescript
import { createReducer, on } from '@ngrx/store';
import { setMapEvents, selectEvent, clearSelectedEvent, toggleMapLayer } from './map.actions';

export interface MapState {
  events: any[];
  selectedEventId: string | null;
  activeLayers: string[];
}

export const initialMapState: MapState = {
  events: [],
  selectedEventId: null,
  activeLayers: []
};

export const mapReducer = createReducer(
  initialMapState,
  on(setMapEvents, (state, { events }) => ({
    ...state,
    events
  })),
  on(selectEvent, (state, { eventId }) => ({
    ...state,
    selectedEventId: eventId
  })),
  on(clearSelectedEvent, state => ({
    ...state,
    selectedEventId: null
  })),
  on(toggleMapLayer, (state, { layerId }) => {
    const isActive = state.activeLayers.includes(layerId);
    return {
      ...state,
      activeLayers: isActive
        ? state.activeLayers.filter(id => id !== layerId)
        : [...state.activeLayers, layerId]
    };
  })
);
```

- [ ] **Step 4: Update app state to include map reducer**

Modify: `src/app/store/app.state.ts:1-10`

```typescript
import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';

export interface AppState {
  map: fromMap.MapState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer
  // Other reducers will be added here
};
```

- [ ] **Step 5: Implement Leaflet map initialization with event markers**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectEvent, clearSelectedEvent } from '../store/actions/map.actions';
import { selectMapEvents, selectSelectedEventId } from '../store/selectors/map.selectors';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map-container',
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.css']
})
export class MapContainerComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private markers: L.LayerGroup = L.layerGroup();
  private eventSubscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.initMap();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.eventSubscriptions.forEach(sub => sub.unsubscribe());
  }

  private initMap(): void {
    this.map = L.map('map').setView([23.7, 121.0], 7); // Centered on Taiwan

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.addLayer(this.markers);
  }

  private setupEventListeners(): void {
    // Subscribe to events updates
    const eventsSub = this.store.select(selectMapEvents).subscribe(events => {
      this.updateEventMarkers(events);
    });
    this.eventSubscriptions.push(eventsSub);

    // Subscribe to selected event changes
    const selectedEventSub = this.store.select(selectSelectedEventId).subscribe(eventId => {
      this.handleSelectedEvent(eventId);
    });
    this.eventSubscriptions.push(selectedEventSub);
  }

  private updateEventMarkers(events: any[]): void {
    // Clear existing markers
    this.markers.clearLayers();

    // Add markers for each event
    events.forEach(event => {
      if (event.location && event.location.coordinates) {
        const [lat, lng] = event.location.coordinates;
        const marker = L.marker([lat, lng])
          .bindPopup(`<b>${event.title}</b><br>${event.date?.start}`)
          .on('click', () => {
            this.store.dispatch(selectEvent({ eventId: event.id }));
          });
        this.markers.addLayer(marker);
      }
    });
  }

  private handleSelectedEvent(eventId: string | null): void {
    // Highlight selected marker (implementation would depend on marker tracking)
    // For now, we'll rely on the popup to indicate selection
  }

  // Method to be called from timeline when period changes
  public updateEventsByPeriod(periodId: string): void {
    // This would be implemented with a service that filters events by period
    // For now, we'll dispatch an action that would be handled by an effect
    // this.store.dispatch(filterEventsByPeriod({ periodId }));
  }
}
```

- [ ] **Step 6: Create HTML template**

```html
<div id="map" class="map-container"></div>
```

- [ ] **Step 7: Add basic CSS styling**

```css
.map-container {
  height: 100%;
  width: 100%;
}
```

- [ ] **Step 8: Update app component to include map container**

Modify: `src/app/app.component.html:1-1`

```html
<app-map-container></app-map-container>
```

- [ ] **Step 9: Run application to verify map displays**

Run: `ng serve`
Expected: Map of Taiwan visible in browser with ability to add markers

- [ ] **Step 10: Commit map component implementation**

```bash
git add src/app/map-container/ src/app/app.component.html src/app/store/actions/map.actions.ts src/app/store/reducers/map.reducer.ts src/app/store/app.state.ts
git commit -m "feat: implement Leaflet map container with NgRx integration"
```

### Task 3: Timeline Component (TimelineComponent)

**Files:**
- Create: `src/app/timeline/timeline.component.ts`
- Create: `src/app/timeline/timeline.component.html`
- Create: `src/app/timeline/timeline.component.css`
- Create: `src/app/store/actions/timeline.actions.ts`
- Create: `src/app/store/reducers/timeline.reducer.ts`
- Modify: `src/app/store/app.state.ts`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component timeline --skip-tests
```

- [ ] **Step 2: Create NgRx actions for timeline**

```typescript
import { createAction, props } from '@ngrx/store';

export const setCurrentPeriod = createAction(
  '[Timeline] Set Current Period',
  props<{ periodId: string }>()
);

export const loadTimelinePeriods = createAction(
  '[Timeline] Load Periods'
);

export const loadTimelinePeriodsSuccess = createAction(
  '[Timeline] Load Periods Success',
  props<{ periods: any[] }>()
);

export const loadTimelinePeriodsFailure = createAction(
  '[Timeline] Load Periods Failure',
  props<{ error: string }>()
);
```

- [ ] **Step 3: Create timeline reducer**

```typescript
import { createReducer, on } from '@ngrx/store';
import * as TimelineActions from './timeline.actions';

export interface TimelineState {
  periods: any[];
  currentPeriodId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialTimelineState: TimelineState = {
  periods: [],
  currentPeriodId: null,
  loading: false,
  error: null
};

export const timelineReducer = createReducer(
  initialTimelineState,
  on(loadTimelinePeriods, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadTimelinePeriodsSuccess, (state, { periods }) => ({
    ...state,
    periods,
    loading: false,
    error: null
  })),
  on(loadTimelinePeriodsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(setCurrentPeriod, (state, { periodId }) => ({
    ...state,
    currentPeriodId: periodId
  }))
);
```

- [ ] **Step 4: Update app state to include timeline reducer**

Modify: `src/app/store/app.state.ts:1-15`

```typescript
import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';
import * as fromTimeline from './reducers/timeline.reducer';

export interface AppState {
  map: fromMap.MapState;
  timeline: fromTimeline.TimelineState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer,
  timeline: fromTimeline.timelineReducer
  // Other reducers will be added here
};
```

- [ ] **Step 5: Create timeline data service**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import * as TimelineActions from './store/actions/timeline.actions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private timelineDataUrl = 'assets/data/timeline.json';

  constructor(private http: HttpClient, private store: Store<AppState>) {}

  loadTimelinePeriods(): void {
    this.store.dispatch(TimelineActions.loadTimelinePeriods());
    
    this.http.get<any[]>(this.timelineDataUrl).subscribe({
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

- [ ] **Step 6: Implement timeline component with period selection**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as TimelineActions from '../store/actions/timeline.actions';
import { selectPeriods, selectCurrentPeriodId, selectTimelineLoading, selectTimelineError } from '../store/selectors/timeline.selectors';
import { Subscription } from 'rxjs';
import { TimelineService } from '../services/timeline.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, OnDestroy {
  periods$ = this.store.select(selectPeriods);
  currentPeriodId$ = this.store.select(selectCurrentPeriodId);
  loading$ = this.store.select(selectTimelineLoading);
  error$ = this.store.select(selectTimelineError);
  
  private subscriptions: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
    private timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    // Load timeline periods
    this.timelineService.loadTimelinePeriods();
    
    // Subscribe to current period changes to notify map component
    const periodSub = this.currentPeriodId$.subscribe(periodId => {
      // Notify map component to filter events by period
      // This would be implemented via a service or additional state
      console.log('Period changed to:', periodId);
    });
    this.subscriptions.push(periodSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onPeriodChange(periodId: string): void {
    this.store.dispatch(TimelineActions.setCurrentPeriod({ periodId }));
  }

  getPeriodLabel(period: any): string {
    return period.label || period.id;
  }
}
```

- [ ] **Step 7: Create HTML template with interactive timeline**

```html
<div class="timeline-container">
  <div class="timeline-header">
    <h3>歷史時間軸</h3>
  </div>
  
  <div *ngIf="loading$ | async" class="loading-indicator">
    載入時間軸中...
  </div>
  
  <div *ngIf="(error$ | async) !== null" class="error-message">
    載入失敗: {{ error$ | async }}
  </div>
  
  <div *ngIf="(loading$ | async) === false && (error$ | async) === null" class="timeline-content">
    <div class="period-buttons">
      <button 
        *ngFor="let period of periods$ | async"
        class="period-btn"
        [class.active]="(currentPeriodId$ | async) === period.id"
        (click)="onPeriodChange(period.id)"
      >
        {{ getPeriodLabel(period) }}
      </button>
    </div>
    
    <div class="timeline-slider-container">
      <!-- Actual slider implementation would go here -->
      <div class="slider-label">拖動以選擇精確時間</div>
      <input type="range" min="-5000" max="2023" value="-5000" class="timeline-slider">
      <div class="slider-values">
        <span>-5000 年前</span>
        <span>2023 年</span>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 8: Add CSS styling for timeline**

```css
.timeline-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.timeline-header {
  margin-bottom: 1rem;
  text-align: center;
}

.timeline-header h3 {
  margin: 0;
  color: #333;
}

.loading-indicator,
.error-message {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.error-message {
  color: #dc3545;
}

.period-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  border-color: #bbb;
}

.period-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.timeline-slider-container {
  margin-top: 1rem;
}

.slider-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.timeline-slider {
  width: 100%;
  height: 6px;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}
```

- [ ] **Step 9: Update app component to include timeline**

Modify: `src/app/app.component.html:1-2`

```html
<app-map-container></app-map-container>
<app-timeline></app-timeline>
```

- [ ] **Step 10: Run application to verify timeline displays**

Run: `ng serve`
Expected: Timeline with period buttons visible below map, able to select periods

- [ ] **Step 11: Commit timeline component implementation**

```bash
git add src/app/timeline/ src/app/app.component.html src/app/store/actions/timeline.actions.ts src/app/store/reducers/timeline.reducer.ts src/app/store/app.state.ts src/app/services/timeline.service.ts
git commit -m "feat: implement timeline component with NgRx integration and period selection"
```

### Task 4: Event Sidebar Component (EventSidebarComponent)

**Files:**
- Create: `src/app/event-sidebar/event-sidebar.component.ts`
- Create: `src/app/event-sidebar/event-sidebar.component.html`
- Create: `src/app/event-sidebar/event-sidebar.component.css`
- Create: `src/app/store/actions/event.actions.ts`
- Create: `src/app/store/reducers/event.reducer.ts`
- Create: `src/app/store/selectors/event.selectors.ts`
- Modify: `src/app/store/app.state.ts`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component event-sidebar --skip-tests
```

- [ ] **Step 2: Create NgRx actions for event management**

```typescript
import { createAction, props } from '@ngrx/store';

export const loadEvents = createAction(
  '[Event] Load Events'
);

export const loadEventsSuccess = createAction(
  '[Event] Load Events Success',
  props<{ events: any[] }>()
);

export const loadEventsFailure = createAction(
  '[Event] Load Events Failure',
  props<{ error: string }>()
);

export const selectEvent = createAction(
  '[Event] Select Event',
  props<{ eventId: string }>()
);

export const clearSelectedEvent = createAction(
  '[Event] Clear Selected Event'
);
```

- [ ] **Step 3: Create event reducer**

```typescript
import { createReducer, on } from '@ngrx/store';
import * as EventActions from './event.actions';

export interface EventState {
  events: any[];
  selectedEventId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialEventState: EventState = {
  events: [],
  selectedEventId: null,
  loading: false,
  error: null
};

export const eventReducer = createReducer(
  initialEventState,
  on(loadEvents, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadEventsSuccess, (state, { events }) => ({
    ...state,
    events,
    loading: false,
    error: null
  })),
  on(loadEventsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(selectEvent, (state, { eventId }) => ({
    ...state,
    selectedEventId: eventId
  })),
  on(clearSelectedEvent, state => ({
    ...state,
    selectedEventId: null
  }))
);
```

- [ ] **Step 4: Update app state to include event reducer**

Modify: `src/app/store/app.state.ts:1-20`

```typescript
import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';
import * as fromTimeline from './reducers/timeline.reducer';
import * as fromEvent from './reducers/event.reducer';

export interface AppState {
  map: fromMap.MapState;
  timeline: fromTimeline.TimelineState;
  event: fromEvent.EventState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer,
  timeline: fromTimeline.timelineReducer,
  event: fromEvent.eventReducer
  // Other reducers will be added here
};
```

- [ ] **Step 5: Create event selectors**

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EventState } from './event.reducer';

export const selectEventState = createFeatureSelector<EventState>('event');

export const selectEvents = createSelector(
  selectEventState,
  (state: EventState) => state.events
);

export const selectSelectedEventId = createSelector(
  selectEventState,
  (state: EventState) => state.selectedEventId
);

export const selectSelectedEvent = createSelector(
  selectEvents,
  selectSelectedEventId,
  (events, selectedEventId) => {
    if (!selectedEventId || !events) {
      return null;
    }
    return events.find(event => event.id === selectedEventId) || null;
  }
);

export const selectEventLoading = createSelector(
  selectEventState,
  (state: EventState) => state.loading
);

export const selectEventError = createSelector(
  selectEventState,
  (state: EventState) => state.error
);
```

- [ ] **Step 6: Create event data service**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import * as EventActions from './store/actions/event.actions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsDataUrl = 'assets/data/events.json';

  constructor(private http: HttpClient, private store: Store<AppState>) {}

  loadEvents(): void {
    this.store.dispatch(EventActions.loadEvents());
    
    this.http.get<any[]>(this.eventsDataUrl).subscribe({
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

- [ ] **Step 7: Implement event sidebar with exam relevance info**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectSelectedEvent, selectEventLoading, selectEventError } from '../store/selectors/event.selectors';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-event-sidebar',
  templateUrl: './event-sidebar.component.html',
  styleUrls: ['./event-sidebar.component.css']
})
export class EventSidebarComponent implements OnInit, OnDestroy {
  selectedEvent$ = this.store.select(selectSelectedEvent);
  loading$ = this.store.select(selectEventLoading);
  error$ = this.store.select(selectEventError);
  
  private subscription!: Subscription;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription = this.selectedEvent$.subscribe(event => {
      // Handle selected event changes
      console.log('Selected event changed:', event);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  closeSidebar(): void {
    // Dispatch action to clear selected event
    this.store.dispatch(selectEvent({ eventId: '' })); // Empty string to clear
    // Or use clearSelectedEvent action if defined
    // this.store.dispatch(clearSelectedEvent());
  }
}
```

- [ ] **Step 3: Create HTML template with exam info**

```html
<div class="sidebar" *ngIf="(selectedEvent$ | async) as event; else loadingTemplate">
  <div class="sidebar-header">
    <h3>{{ event.title }}</h3>
    <button class="close-btn" (click)="closeSidebar()">×</button>
  </div>
  
  <div class="sidebar-content">
    <p><strong>時間:</strong> {{ event.date?.start }} ~ {{ event.date?.end }}</p>
    <p><strong>地點:</strong> {{ event.location?.name }}</p>
    <p>{{ event.description }}</p>
    
    <div class="exam-info" *ngIf="event.examRelevance">
      <h4>考試重點</h4>
      <p><strong>重要度:</strong> {{ event.examRelevance.importance }}</p>
      <p><strong>題型:</strong> {{ event.examRelevance.questionTypes.join(', ') }}</p>
      <p><strong>教科書對應:</strong> {{ event.examRelevance.textbookReferences?.join(', ') }}</p>
    </div>
  </div>
</div>

<ng-template #loadingTemplate>
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>載入中...</h3>
    </div>
    <div class="sidebar-content">
      <p>正在載入事件資料...</p>
    </div>
  </div>
</ng-template>
```

- [ ] **Step 4: Add CSS styling for sidebar**

```css
.sidebar {
  position: fixed;
  top: 0;
  right: -350px;
  width: 350px;
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  padding: 1rem;
}

.sidebar.open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.sidebar-content {
  line-height: 1.6;
}

.exam-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.exam-info h4 {
  margin-top: 0;
}
```

- [ ] **Step 5: Update app component to include sidebar**

Modify: `src/app/app.component.html:1-4`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<app-progress-tracker></app-progress-tracker>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 6: Run application to verify sidebar functionality**

Run: `ng serve`
Expected: Sidebar that shows event details when an event is selected on the map

- [ ] **Step 7: Commit event sidebar component**

```bash
git add src/app/event-sidebar/ src/app/app.component.html src/app/store/actions/event.actions.ts src/app/store/reducers/event.reducer.ts src/app/store/selectors/event.selectors.ts src/app/store/app.state.ts src/app/services/event.service.ts
git commit -m "feat: implement event sidebar component with NgRx integration and exam info"
```

### Task 5: Search Bar Component (SearchBarComponent)

**Files:**
- Create: `src/app/search-bar/search-bar.component.ts`
- Create: `src/app/search-bar/search-bar.component.html`
- Create: `src/app/search-bar/search-bar.component.css`
- Create: `src/app/store/actions/search.actions.ts`
- Create: `src/app/store/reducers/search.reducer.ts`
- Modify: `src/app/store/app.state.ts`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component search-bar --skip-tests
```

- [ ] **Step 2: Create NgRx actions for search functionality**

```typescript
import { createAction, props } from '@ngrx/store';

export const updateSearchQuery = createAction(
  '[Search] Update Query',
  props<{ query: string }>()
);

export const setSearchResults = createAction(
  '[Search] Set Results',
  props<{ results: any[] }>()
);

export const clearSearchResults = createAction(
  '[Search] Clear Results'
);
```

- [ ] **Step 3: Create search reducer**

```typescript
import { createReducer, on } from '@ngrx/store';
import * as SearchActions from './search.actions';

export interface SearchState {
  query: string;
  results: any[];
  loading: boolean;
}

export const initialSearchState: SearchState = {
  query: '',
  results: [],
  loading: false
};

export const searchReducer = createReducer(
  initialSearchState,
  on(updateSearchQuery, (state, { query }) => ({
    ...state,
    query
  })),
  on(setSearchResults, (state, { results }) => ({
    ...state,
    results,
    loading: false
  })),
  on(clearSearchResults, state => ({
    ...state,
    results: [],
    loading: false
  }))
);
```

- [ ] **Step 4: Update app state to include search reducer**

Modify: `src/app/store/app.state.ts:1-25`

```typescript
import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';
import * as fromTimeline from './reducers/timeline.reducer';
import * as fromEvent from './reducers/event.reducer';
import * as fromSearch from './reducers/search.reducer';

export interface AppState {
  map: fromMap.MapState;
  timeline: fromTimeline.TimelineState;
  event: fromEvent.EventState;
  search: fromSearch.SearchState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer,
  timeline: fromTimeline.timelineReducer,
  event: fromEvent.eventReducer,
  search: fromSearch.searchReducer
  // Other reducers will be added here
};
```

- [ ] **Step 5: Create search selectors**

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchState } from './search.reducer';

export const selectSearchState = createFeatureSelector<SearchState>('search');

export const selectSearchQuery = createSelector(
  selectSearchState,
  (state: SearchState) => state.query
);

export const selectSearchResults = createSelector(
  selectSearchState,
  (state: SearchState) => state.results
);

export const selectSearchLoading = createSelector(
  selectSearchState,
  (state: SearchState) => state.loading
);
```

- [ ] **Step 6: Create search service with Fuse.js**

```typescript
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import * as SearchActions from './store/actions/search.actions';
import * as EventSelectors from '../store/selectors/event.selectors';
import * as Fuse from 'fuse.js';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private fuse!: Fuse<any>;
  private eventsSubscription!: Subscription;

  constructor(
    private store: Store<AppState>
  ) {
    // Initialize Fuse.js when events are loaded
    this.eventsSubscription = this.store.select(EventSelectors.selectEvents).subscribe(events => {
      if (events.length > 0) {
        this.fuse = new Fuse(events, {
          keys: ['title', 'description', 'keywords', 'location.name'],
          threshold: 0.3
        });
      }
    });
  }

  search(query: string): void {
    if (!this.fuse || !query.trim()) {
      this.store.dispatch(SearchActions.clearSearchResults());
      return;
    }
    
    const results = this.fuse.search(query).map(result => result.item);
    this.store.dispatch(SearchActions.setSearchResults({ results }));
  }

  clearSearch(): void {
    this.store.dispatch(SearchActions.clearSearchResults());
  }

  destroy(): void {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }
}
```

- [ ] **Step 7: Implement search bar component**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as SearchActions from '../store/actions/search.actions';
import { selectSearchQuery, selectSearchResults, selectSearchLoading } from '../store/selectors/search.selectors';
import { SearchService } from '../services/search.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  searchQuery$ = this.store.select(selectSearchQuery);
  searchResults$ = this.store.select(selectSearchResults);
  loading$ = this.store.select(selectSearchLoading);
  
  private querySubscription!: Subscription;
  private resultsSubscription!: Subscription;
  currentQuery = '';

  constructor(
    private store: Store<AppState>,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Subscribe to query changes to keep local state in sync
    this.querySubscription = this.searchQuery$.subscribe(query => {
      this.currentQuery = query;
    });
    
    // Subscribe to results changes
    this.resultsSubscription = this.searchResults$.subscribe(results => {
      // Handle results update (UI will update via async pipe)
      console.log('Search results updated:', results.length);
    });
  }

  ngOnDestroy(): void {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
    if (this.resultsSubscription) {
      this.resultsSubscription.unsubscribe();
    }
    this.searchService.destroy();
  }

  onSearch(): void {
    this.store.dispatch(SearchActions.updateSearchQuery({ query: this.currentQuery }));
    this.searchService.search(this.currentQuery);
  }

  onClear(): void {
    this.store.dispatch(SearchActions.updateSearchQuery({ query: '' }));
    this.searchService.clearSearch();
  }
}
```

- [ ] **Step 3: Create HTML template**

```html
<div class="search-bar">
  <input 
    type="text" 
    [(ngModel)]="currentQuery"
    (keyup.enter)="onSearch()"
    placeholder="搜尋歷史事件、地點或關鍵字..."
    class="search-input"
  >
  <button class="search-btn" (click)="onSearch()">搜尋</button>
  <button class="clear-btn" (click)="onClear()" *ngIf="currentQuery">×</button>
  
  <div *ngIf="loading$ | async" class="search-loading">
    搜尋中...
  </div>
  
  <div class="search-results" *ngIf="(searchResults$ | async)?.length > 0 && !(loading$ | async)">
    <h4>搜尋結果 ({{ (searchResults$ | async)?.length }})</h4>
    <ul>
      <li *ngFor="let result of (searchResults$ | async)?.slice(0, 5)">
        {{ result.title }} - {{ result.location?.name }}
      </li>
    </ul>
    <div *ngIf="(searchResults$ | async)?.length > 5" class="more-results">
      還有 {{ (searchResults$ | async)?.length - 5 }} 個結果...
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add CSS styling**

```css
.search-bar {
  display: flex;
  gap: 0.5rem;
  margin: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-btn {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background-color: #0056b3;
}

.clear-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
}

.clear-btn:hover {
  color: #333;
}

.search-loading {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-style: italic;
}

.search-results {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.search-results h4 {
  margin-top: 0;
}

.search-results ul {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.more-results {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  padding: 0.5rem;
}
```

- [ ] **Step 5: Update app component to include search bar**

Modify: `src/app/app.component.html:1-5`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<app-progress-tracker></app-progress-tracker>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 6: Run application to verify search bar**

Run: `ng serve`
Expected: Search bar visible at top, functional when events are loaded

- [ ] **Step 7: Commit search bar component**

```bash
git add src/app/search-bar/ src/app/app.component.html src/app/store/actions/search.actions.ts src/app/store/reducers/search.reducer.ts src/app/store/app.state.ts src/app/services/search.service.ts
git commit -m "feat: implement search bar component with NgRx integration and Fuse.js fuzzy search"
```

### Task 6: Layer Control Component (LayerControlComponent)

**Files:**
- Create: `src/app/layer-control/layer-control.component.ts`
- Create: `src/app/layer-control/layer-control.component.html`
- Create: `src/app/layer-control/layer-control.component.css`
- Create: `src/app/store/actions/map.actions.ts` (additional actions)
- Modify: `src/app/store/reducers/map.reducer.ts` (additional logic)
- Modify: `src/app/store/app.state.ts` (no changes needed, already includes map)

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component layer-control --skip-tests
```

- [ ] **Step 2: Add layer toggle action to map actions** (if not already present)

```typescript
// In src/app/store/actions/map.actions.ts, add:
export const toggleMapLayer = createAction(
  '[Map] Toggle Layer',
  props<{ layerId: string }>()
);
```

- [ ] **Step 3: Update map reducer to handle layer toggling** (if not already present)

```typescript
// In src/app/store/reducers/map.reducer.ts, ensure the toggleMapLayer case exists:
on(toggleMapLayer, (state, { layerId }) => {
  const isActive = state.activeLayers.includes(layerId);
  return {
    ...state,
    activeLayers: isActive
      ? state.activeLayers.filter(id => id !== layerId)
      : [...state.activeLayers, layerId]
  };
})
```

- [ ] **Step 4: Implement layer control component**

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectMapActiveLayers } from '../store/selectors/map.selectors';
import { toggleMapLayer } from '../store/actions/map.actions';

interface MapLayer {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.css']
})
export class LayerControlComponent implements OnInit {
  layers: MapLayer[] = [
    { id: 'terrain', name: '地形圖', description: '顯示等高線和地形特徵', icon: '⛰️' },
    { id: 'climate', name: '氣候圖', description: '顯示溫度、降水量分布', icon: '🌡️' },
    { id: 'boundaries', name: '政治邊界', description: '顯示歷史上的行政區劃', icon: '🗺️' },
    { id: 'economy', name: '產業分布', description: '顯示歷史時期的產業分布', icon: '🏭' }
  ];
  
  activeLayers$ = this.store.select(selectMapActiveLayers);

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
  }

  toggleLayer(layerId: string): void {
    this.store.dispatch(toggleMapLayer({ layerId }));
  }

  isLayerActive(layerId: string): boolean {
    let isActive = false;
    this.activeLayers$.subscribe(layers => {
      isActive = layers.includes(layerId);
    }).unsubscribe();
    return isActive;
  }
}
```

- [ ] **Step 3: Create HTML template**

```html
<div class="layer-control">
  <div class="layer-header">
    <h4>地圖圖層</h4>
  </div>
  <div class="layer-list">
    <div *ngFor="let layer of layers" class="layer-item">
      <label class="layer-label">
        <input 
          type="checkbox" 
          [checked]="isLayerActive(layer.id)"
          (change)="toggleLayer(layer.id)"
        >
        <span class="layer-icon">{{ layer.icon }}</span>
        <span class="layer-name">{{ layer.name }}</span>
        <small class="layer-description">{{ layer.description }}</small>
      </label>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add CSS styling**

```css
.layer-control {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1rem;
  margin: 1rem;
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 250px;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.layer-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.layer-item {
  display: flex;
  align-items: center;
}

.layer-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.layer-label:hover {
  background-color: #f8f9fa;
}

.layer-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.layer-name {
  flex: 1;
  font-weight: 500;
}

.layer-description {
  font-size: 0.85rem;
  color: #666;
}
```

- [ ] **Step 5: Update app component to include layer control**

Modify: `src/app/app.component.html:1-6`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<app-progress-tracker></app-progress-tracker>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 6: Run application to verify layer control**

Run: `ng serve`
Expected: Layer control panel visible in top-right corner with functional checkboxes

- [ ] **Step 7: Commit layer control component**

```bash
git add src/app/layer-control/ src/app/app.component.html
git commit -m "feat: implement layer control component with NgRx integration"
```

### Task 7: Exam Mode Component (ExamModeComponent)

**Files:**
- Create: `src/app/exam-mode/exam-mode.component.ts`
- Create: `src/app/exam-mode/exam-mode.component.html`
- Create: `src/app/exam-mode/exam-mode.component.css`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component exam-mode --skip-tests
```

- [ ] **Step 2: Implement exam mode with practice questions**

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectEvents } from '../store/selectors/event.selectors';
import { selectCurrentPeriod } from '../store/selectors/timeline.selectors';

interface ExamQuestion {
  id: string;
  type: 'map-location' | 'timeline-order' | 'concept-explanation';
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  relatedEventIds: string[];
}

@Component({
  selector: 'app-exam-mode',
  templateUrl: './exam-mode.component.html',
  styleUrls: ['./exam-mode.component.css']
})
export class ExamModeComponent implements OnInit {
  events$ = this.store.select(selectEvents);
  currentPeriod$ = this.store.select(selectCurrentPeriod);
  
  questions: ExamQuestion[] = [];
  currentQuestionIndex = 0;
  score = 0;
  isExamActive = false;
  showAnswer = false;

  constructor(private store: Store) {}

  ngOnInit(): void {
    // Load events and generate questions based on current period
    this.events$.subscribe(events => {
      this.generateQuestions(events);
    });
  }

  generateQuestions(events: any[]): void {
    // Filter events by current period
    // Generate different types of questions:
    // 1. Map-location: Given event description, click on map location
    // 2. Timeline-order: Put events in chronological order
    // 3. Concept-explanation: Explain historical concepts
    
    // Placeholder implementation
    this.questions = [
      {
        id: 'q1',
        type: 'map-location',
        prompt: '在地圖上點擊熱蘭遮城的位置',
        correctAnswer: 'dutch-spanish-fort-zeelandia',
        explanation: '熱蘭遮城是荷蘭人在臺灣建造的 fortificatio，位於今臺南市安平區',
        relatedEventIds: ['dutch-settlement-taoyuan']
      }
      // More questions to be generated dynamically
    ];
  }

  startExam(): void {
    this.isExamActive = true;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.showAnswer = false;
  }

  answerQuestion(answer: string | string[]): void {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const isCorrect = JSON.stringify(answer) === JSON.stringify(currentQuestion.correctAnswer);
    
    if (isCorrect) {
      this.score++;
    }
    
    this.showAnswer = true;
    
    // Auto-advance to next question after delay
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.showAnswer = false;
    } else {
      this.isExamActive = false;
    }
  }

  get currentQuestion(): ExamQuestion | undefined {
    return this.questions[this.currentQuestionIndex];
  }
}
```

- [ ] **Step 3: Create HTML template**

```html
<div class="exam-mode" *ngIf="isExamActive">
  <div class="exam-header">
    <h2>會考練習模式</h2>
    <div class="exam-progress">
      第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 題
    </div>
    <div class="exam-score">
      分數: {{ score }} / {{ questions.length }}
    </div>
  </div>
  
  <div class="exam-content" *ngIf="currentQuestion">
    <div class="question-card">
      <h3>{{ currentQuestion.prompt }}</h3>
      
      <div *ngIf="currentQuestion.type === 'map-location'" class="map-question">
        <p>請在下方地圖中點擊正確位置：</p>
        <!-- Map interaction will be implemented here -->
        <div class="practice-map" id="practice-map"></div>
      </div>
      
      <div *ngIf="currentQuestion.type === 'timeline-order'" class="timeline-question">
        <!-- Timeline ordering interface -->
        <div class="timeline-order-container">
          <!-- Drag and drop items to order -->
        </div>
      </div>
      
      <div *ngIf="currentQuestion.type === 'concept-explanation'" class="concept-question">
        <!-- Text input for explanation -->
        <textarea 
          [(ngModel)]="userAnswer"
          placeholder="請在此解釋歷史概念..."
          rows="4"
          class="answer-input"
        ></textarea>
      </div>
      
      <div *ngIf="currentQuestion.options" class="options">
        <div *ngFor="let option of currentQuestion.options" class="option">
          <input 
            type="radio" 
            [value]="option"
            [(ngModel)]="selectedOption"
            name="option"
          >
          <label>{{ option }}</label>
        </div>
      </div>
    </div>
    
    <div class="exam-actions">
      <button 
        *ngIf="!showAnswer"
        class="btn btn-primary"
        (click)="answerQuestion(getUserAnswer())"
      >
        提交答案
      </button>
      
      <button 
        *ngIf="showAnswer && currentQuestionIndex < questions.length - 1"
        class="btn btn-secondary"
        (click)="nextQuestion()"
      >
        下一題
      </button>
      
      <button 
        *ngIf="showAnswer && currentQuestionIndex >= questions.length - 1"
        class="btn btn-success"
        (click)="startExam()"
      >
        重新開始
      </button>
    </div>
  </div>
  
  <div class="exam-result" *ngIf="!isExamActive && questions.length > 0">
    <h3>考試結束！</h3>
    <p>你的分數是：{{ score }} / {{ questions.length }}</p>
    <p>{{ getScoreMessage() }}</p>
    <button class="btn btn-primary" (click)="startExam()">重新考試</button>
  </div>
  
  <div class="exam-answer-explanation" *ngIf="showAnswer && currentQuestion">
    <h4>答案解析</h4>
    <p>{{ currentQuestion.explanation }}</p>
  </div>
</div>

<div class="exam-start" *ngIf="!isExamActive">
  <h2>會考練習模式</h2>
  <p>透過互動題目檢驗你對歷史事件的理解與記憶</p>
  <button class="btn btn-primary" (click)="startExam()">開始練習</button>
</div>
```

- [ ] **Step 4: Add CSS styling**

```css
.exam-mode {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.exam-header h2 {
  margin: 0;
}

.exam-progress,
.exam-score {
  font-size: 1.1rem;
  font-weight: 500;
}

.exam-content {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 2rem;
}

.question-card h3 {
  margin-top: 0;
  color: #333;
}

.map-question,
.timeline-question,
.concept-question {
  margin-bottom: 1.5rem;
}

.practice-map {
  height: 300px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  display: flex;
  align-items: center;
}

.option input {
  margin-right: 0.5rem;
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}

.exam-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.exam-result {
  text-align: center;
  padding: 2rem;
  background-color: #e9ecef;
  border-radius: 6px;
}

.exam-answer-explanation {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 0 4px 4px 0;
}

.exam-start {
  text-align: center;
  padding: 3rem;
}

.exam-start h2 {
  color: #333;
  margin-bottom: 1rem;
}

.exam-start p {
  color: #666;
  margin-bottom: 2rem;
}
```

- [ ] **Step 5: Update app component to include exam mode (conditional)**

Modify: `src/app/app.component.html:1-6`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
```

- [ ] **Step 6: Add exam mode toggle to app component**

Modify: `src/app/app.component.ts:1-10`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'cap-map';
  showExamMode = false;

  toggleExamMode(): void {
    this.showExamMode = !this.showExamMode;
  }
}
```

Modify: `src/app/app.component.html:1-7`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 7: Add CSS for exam toggle button**

Modify: `src/app/app.component.css:1-10`

```css
.exam-toggle-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: all 0.3s ease;
}

.exam-toggle-btn:hover {
  background-color: #1e7e34;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
```

- [ ] **Step 8: Run application to verify exam mode**

Run: `ng serve`
Expected: Exam toggle button visible, clicking opens exam mode with practice questions

- [ ] **Step 9: Commit exam mode component**

```bash
git add src/app/exam-mode/ src/app/app.component.html src/app/app.component.ts src/app/app.component.css
git commit -m "feat: implement exam mode component with practice questions"
```

### Task 8: Progress Tracker Component (ProgressTrackerComponent)

**Files:**
- Create: `src/app/progress-tracker/progress-tracker.component.ts`
- Create: `src/app/progress-tracker/progress-tracker.component.html`
- Create: `src/app/progress-tracker/progress-tracker.component.css`
- Create: `src/app/store/actions/progress.actions.ts`
- Create: `src/app/store/reducers/progress.reducer.ts`
- Create: `src/app/store/selectors/progress.selectors.ts`
- Modify: `src/app/store/app.state.ts`

- [ ] **Step 1: Generate component using Angular CLI**

```bash
ng generate component progress-tracker --skip-tests
```

- [ ] **Step 2: Create NgRx actions for progress tracking**

```typescript
import { createAction, props } from '@ngrx/store';

export const loadProgress = createAction(
  '[Progress] Load Progress'
);

export const loadProgressSuccess = createAction(
  '[Progress] Load Progress Success',
  props<{ progress: any[] }>()
);

export const loadProgressFailure = createAction(
  '[Progress] Load Progress Failure',
  props<{ error: string }>()
);

export const saveProgress = createAction(
  '[Progress] Save Progress',
  props<{ progress: any[] }>()
);

export const recordEventView = createAction(
  '[Progress] Record Event View',
  props<{ eventId: string }>()
);

export const toggleEventMastery = createAction(
  '[Progress] Toggle Event Mastery',
  props<{ eventId: string }>()
);

export const resetProgress = createAction(
  '[Progress] Reset Progress'
);

export const loadAchievements = createAction(
  '[Progress] Load Achievements'
);

export const loadAchievementsSuccess = createAction(
  '[Progress] Load Achievements Success',
  props<{ achievements: any[] }>()
);

export const loadAchievementsFailure = createAction(
  '[Progress] Load Achievements Failure',
  props<{ error: string }>()
);

export const earnAchievement = createAction(
  '[Progress] Earn Achievement',
  props<{ achievementId: string }>()
);
```

- [ ] **Step 3: Create progress reducer**

```typescript
import { createReducer, on } from '@ngrx/store';
import * as ProgressActions from './progress.actions';

export interface ProgressState {
  learningProgress: any[];
  achievements: any[];
  statistics: any;
  loading: boolean;
  error: string | null;
}

export const initialProgressState: ProgressState = {
  learningProgress: [],
  achievements: [],
  statistics: {
    totalEvents: 0,
    viewedEvents: 0,
    masteredEvents: 0,
    averageScore: 0,
    studyTime: 0
  },
  loading: false,
  error: null
};

export const progressReducer = createReducer(
  initialProgressState,
  on(loadProgress, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadProgressSuccess, (state, { progress }) => ({
    ...state,
    learningProgress: progress,
    loading: false,
    error: null
  })),
  on(loadProgressFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(saveProgress, state => ({
    ...state
    // In a real app, we might save to localStorage here via an effect
  })),
  on(recordEventView, (state, { eventId }) => {
    const progressIndex = state.learningProgress.findIndex(p => p.eventId === eventId);
    const now = new Date().toISOString();
    
    let updatedProgress;
    if (progressIndex >= 0) {
      // Update existing progress
      updatedProgress = state.learningProgress.map((p, index) => 
        index === progressIndex 
          ? { ...p, viewedCount: p.viewedCount + 1, lastViewed: now }
          : p
      );
    } else {
      // Create new progress entry
      updatedProgress = [
        ...state.learningProgress,
        {
          eventId,
          viewedCount: 1,
          lastViewed: now,
          mastered: false,
          examScore: 0
        }
      ];
    }
    
    return {
      ...state,
      learningProgress: updatedProgress
    };
  }),
  on(toggleEventMastery, (state, { eventId }) => {
    const progressIndex = state.learningProgress.findIndex(p => p.eventId === eventId);
    
    if (progressIndex >= 0) {
      const updatedProgress = state.learningProgress.map((p, index) => 
        index === progressIndex 
          ? { ...p, mastered: !p.mastered }
          : p
      );
      
      return {
        ...state,
        learningProgress: updatedProgress
      };
    }
    
    return state;
  }),
  on(resetProgress, state => ({
    ...state,
    learningProgress: [],
    achievements: [],
    statistics: {
      totalEvents: 0,
      viewedEvents: 0,
      masteredEvents: 0,
      averageScore: 0,
      studyTime: 0
    }
  })),
  on(loadAchievementsSuccess, (state, { achievements }) => ({
    ...state,
    achievements,
    loading: false,
    error: null
  })),
  on(loadAchievementsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(earnAchievement, (state, { achievementId }) => {
    const achievementIndex = state.achievements.findIndex(a => a.id === achievementId);
    
    if (achievementIndex >= 0 && !state.achievements[achievementIndex].earned) {
      const updatedAchievements = state.achievements.map((a, index) => 
        index === achievementIndex 
          ? { ...a, earned: true, earnedDate: new Date().toISOString() }
          : a
      );
      
      return {
        ...state,
        achievements: updatedAchievements
      };
    }
    
    return state;
  })
);
```

- [ ] **Step 4: Update app state to include progress reducer**

Modify: `src/app/store/app.state.ts:1-30`

```typescript
import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';
import * as fromTimeline from './reducers/timeline.reducer';
import * as fromEvent from './reducers/event.reducer';
import * as fromSearch from './reducers/search.reducer';
import * as fromProgress from './reducers/progress.reducer';

export interface AppState {
  map: fromMap.MapState;
  timeline: fromTimeline.TimelineState;
  event: fromEvent.EventState;
  search: fromSearch.SearchState;
  progress: fromProgress.ProgressState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer,
  timeline: fromTimeline.timelineReducer,
  event: fromEvent.eventReducer,
  search: fromSearch.searchReducer,
  progress: fromProgress.progressReducer
  // Other reducers will be added here
};
```

- [ ] **Step 5: Create progress selectors**

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProgressState } from './progress.reducer';

export const selectProgressState = createFeatureSelector<ProgressState>('progress');

export const selectLearningProgress = createSelector(
  selectProgressState,
  (state: ProgressState) => state.learningProgress
);

export const selectAchievements = createSelector(
  selectProgressState,
  (state: ProgressState) => state.achievements
);

export const selectProgressStatistics = createSelector(
  selectProgressState,
  (state: ProgressState) => state.statistics
);

export const selectProgressLoading = createSelector(
  selectProgressState,
  (state: ProgressState) => state.loading
);

export const selectProgressError = createSelector(
  selectProgressState,
  (state: ProgressState) => state.error
);

// Derived selectors
export const selectMasteryPercentage = createSelector(
  selectLearningProgress,
  (progress) => {
    if (!progress || progress.length === 0) return 0;
    const masteredCount = progress.filter(p => p.mastered).length;
    return Math.round((masteredCount / progress.length) * 100);
  }
);
```

- [ ] **Step 6: Create progress data service (for localStorage)**

```typescript
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import * as ProgressActions from './store/actions/progress.actions';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private STORAGE_KEY_PREFIX = 'cap-map-';

  constructor(private store: Store<AppState>) {}

  loadProgress(): void {
    // In a real app, we might use an effect to handle this
    // For simplicity, we'll dispatch actions that would be handled by effects
    this.store.dispatch(ProgressActions.loadProgress());
    
    // Simulate loading from localStorage
    const savedProgress = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}progress`);
    const savedAchievements = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}achievements`);
    const savedStatistics = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}statistics`);
    
    if (savedProgress) {
      this.store.dispatch(ProgressActions.loadProgressSuccess({ 
        progress: JSON.parse(savedProgress) 
      }));
    } else {
      this.store.dispatch(ProgressActions.loadProgressSuccess({ progress: [] }));
    }
    
    if (savedAchievements) {
      this.store.dispatch(ProgressActions.loadAchievementsSuccess({ 
        achievements: JSON.parse(savedAchievements) 
      }));
    } else {
      // Initialize default achievements
      const defaultAchievements = [
        { id: 'first-view', name: '第一次探索', description: '查看您的第一個歷史事件', icon: '👀', earned: false },
        { id: 'ten-events', name: '十連霸', description: '查看十個不同的歷史事件', icon: '🔟', earned: false },
        { id: 'history-buff', name: '歷史通', description: '查看五十個不同的歷史事件', icon: '📚', earned: false },
        { id: 'map-master', name: '地圖達人', description: '在正確地點點擊二十個歷史事件', icon: '🗺️', earned: false },
        { id: 'exam-ace', name: '會考高手', description: '在會考模式中達成百分之八十以上的正確率', icon: '🏆', earned: false },
        { id: 'timeline-expert', name: '時間軸專家', description: '正確排序十個歷史事件的時間順序', icon: '⏳', earned: false }
      ];
      this.store.dispatch(ProgressActions.loadAchievementsSuccess({ achievements: defaultAchievements }));
    }
    
    if (savedStatistics) {
      // Statistics would be updated via other actions
      this.store.dispatch(ProgressActions.loadProgressSuccess({ 
        progress: JSON.parse(savedProgress || '[]') 
      }));
    }
  }

  saveProgress(progress: any[]): void {
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}progress`, JSON.stringify(progress));
    this.store.dispatch(ProgressActions.saveProgress({ progress }));
  }

  saveAchievements(achievements: any[]): void {
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}achievements`, JSON.stringify(achievements));
    // Achievements are saved via the earnAchievement action in effects
  }

  saveStatistics(statistics: any): void {
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}statistics`, JSON.stringify(statistics));
    // Statistics are saved via other actions in effects
  }

  recordEventView(eventId: string): void {
    this.store.dispatch(ProgressActions.recordEventView({ eventId }));
  }

  toggleEventMastery(eventId: string): void {
    this.store.dispatch(ProgressActions.toggleEventMastery({ eventId }));
  }

  resetProgress(): void {
    this.store.dispatch(ProgressActions.resetProgress());
    // Clear localStorage
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}progress`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}achievements`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}statistics`);
  }

  earnAchievement(achievementId: string): void {
    this.store.dispatch(ProgressActions.earnAchievement({ achievementId }));
  }
}
```

- [ ] **Step 7: Implement progress tracker component**

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as ProgressSelectors from '../store/selectors/progress.selectors';
import { ProgressService } from '../services/progress.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.css']
})
export class ProgressTrackerComponent implements OnInit {
  learningProgress$ = this.store.select(ProgressSelectors.selectLearningProgress);
  achievements$ = this.store.select(ProgressSelectors.selectAchievements);
  statistics$ = this.store.select(ProgressSelectors.selectProgressStatistics);
  loading$ = this.store.select(ProgressSelectors.selectProgressLoading);
  error$ = this.store.select(ProgressSelectors.selectProgressError);
  masteryPercentage$ = this.store.select(ProgressSelectors.selectMasteryPercentage);
  
  private subscriptions: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    // Load progress data
    this.progressService.loadProgress();
    
    // Subscribe to progress updates (if needed for additional logic)
    const progressSub = this.learningProgress$.subscribe(progress => {
      // Handle progress updates
      console.log('Learning progress updated:', progress.length);
    });
    this.subscriptions.push(progressSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  recordEventView(eventId: string): void {
    this.progressService.recordEventView(eventId);
  }

  toggleMastery(eventId: string): void {
    this.progressService.toggleEventMastery(eventId);
  }

  resetProgress(): void {
    this.progressService.resetProgress();
  }

  get masteryPercentage(): number {
    let percentage = 0;
    this.masteryPercentage$.subscribe(p => { percentage = p; }).unsubscribe();
    return percentage;
  }
}
```

- [ ] **Step 3: Create HTML template**

```html
<div class="progress-tracker">
  <div class="tracker-header">
    <h2>學習進度追蹤</h2>
  </div>
  
  <div *ngIf="loading$ | async" class="loading-indicator">
    載入進度中...
  </div>
  
  <div *ngIf="(error$ | async) !== null" class="error-message">
    載入失敗: {{ error$ | async }}
  </div>
  
  <div *ngIf="(loading$ | async) === false && (error$ | async) === null" class="progress-content">
    <div class="progress-stats">
      <div class="stat-item">
        <div class="stat-value">{{ (statistics$ | async)?.viewedEvents || 0 }}</div>
        <div class="stat-label">已學習事件</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ (statistics$ | async)?.masteredEvents || 0 }}</div>
        <div class="stat-label">已掌握事件</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ (statistics$ | async)?.averageScore || 0 }}%</div>
        <div class="stat-label">平均考試分數</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ masteryPercentage }}%</div>
        <div class="stat-label">掌握度</div>
      </div>
    </div>
    
    <div class="mastery-progress">
      <div class="progress-label">整體掌握進度</div>
      <div class="progress-bar-container">
        <div class="progress-bar" [style.width.%]="masteryPercentage"></div>
      </div>
      <div class="progress-text">
        {{ masteryPercentage }}% 完成
      </div>
    </div>
    
    <div class="achievements-section">
      <h3>成就系統</h3>
      <div class="achievements-grid">
        <div *ngFor="let achievement of achievements$ | async" 
             class="achievement-card"
             [class.earned]="achievement.earned">
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-info">
            <h4>{{ achievement.name }}</h4>
            <p>{{ achievement.description }}</p>
            <div *ngIf="achievement.earned" class="achievement-date">
              獲得於: {{ achievement.earnedDate | date:'mediumDate' }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="recent-activity">
      <h3>最近學習記錄</h3>
      <div class="activity-list" *ngIf="(learningProgress$ | async)?.length > 0">
        <div *ngFor="let progressItem of (learningProgress$ | async)?.slice(0, 5).reverse()" 
             class="activity-item">
          <div class="activity-info">
            <span class="activity-count">第 {{ progressItem.viewedCount }} 次查看</span>
            <span class="activity-date">{{ progressItem.lastViewed | date:'short' }}</span>
          </div>
          <!-- In a real implementation, we would look up the event name from events -->
          <div class="event-name">[事件名稱]</div>
          <div class="mastery-status" 
              [class.mastered]="progressItem.mastered">
            {{ progressItem.mastered ? '已掌握' : '學習中' }}
          </div>
        </div>
      </div>
      <div *ngIf="(learningProgress$ | async)?.length === 0" class="no-activity">
        尚無學習記錄，開始探索歷史事件吧！
      </div>
    </div>
    
    <div class="mastery-controls">
      <button class="btn btn-outline-secondary" 
              (click)="resetProgress()">
        重置進度
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add CSS styling**

```css
.progress-tracker {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.tracker-header {
  margin-bottom: 1.5rem;
}

.tracker-header h2 {
  margin: 0;
  color: #333;
}

.loading-indicator,
.error-message {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.error-message {
  color: #dc3545;
}

.progress-content {
  /* Content styles */
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.mastery-progress {
  margin-bottom: 1.5rem;
}

.progress-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.progress-bar-container {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.achievements-section {
  margin-bottom: 1.5rem;
}

.achievements-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.achievement-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.achievement-card.earned {
  border-color: #28a745;
  background-color: #f8fff9;
}

.achievement-card:not(.earned) {
  opacity: 0.7;
  filter: grayscale(0.3);
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.achievement-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.achievement-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

.achievement-date {
  font-size: 0.75rem;
  color: #28a745;
  font-weight: 500;
}

.recent-activity {
  margin-bottom: 1.5rem;
}

.recent-activity h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.activity-info {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.activity-count {
  background-color: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.activity-date {
  color: #666;
}

.event-name {
  font-weight: 500;
  min-width: 120px;
}

.mastery-status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: 500;
}

.mastery-status.mastered {
  background-color: #d4edda;
  color: #155724;
}

.mastery-status:not(.mastered) {
  background-color: #fff3cd;
  color: #856404;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.mastery-controls {
  text-align: center;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: white;
}

.btn-outline-secondary:hover {
  color: white;
  background-color: #6c757d;
  border-color: #6c757d;
}
```

- [ ] **Step 5: Update app component to include progress tracker**

Modify: `src/app/app.component.html:1-8`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<app-progress-tracker></app-progress-tracker>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 6: Run application to verify progress tracker**

Run: `ng serve`
Expected: Progress tracker visible, showing statistics and achievements

- [ ] **Step 7: Commit progress tracker component**

```bash
git add src/app/progress-tracker/ src/app/app.component.html src/app/store/actions/progress.actions.ts src/app/store/reducers/progress.reducer.ts src/app/store/selectors/progress.selectors.ts src/app/store/app.state.ts src/app/services/progress.service.ts
git commit -m "feat: implement progress tracker component with NgRx integration and localStorage persistence"
```

- [ ] **Step 2: Implement progress tracker with achievements and statistics**

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectEvents, selectSelectedEvent } from '../store/selectors/event.selectors';
import { selectCurrentPeriod } from '../store/selectors/timeline.selectors';

interface LearningProgress {
  eventId: string;
  viewedCount: number;
  lastViewed: string; // ISO date string
  mastered: boolean;
  examScore: number; // 0-100
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string; // ISO date string
}

@Component({
  selector: 'app-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.css']
})
export class ProgressTrackerComponent implements OnInit {
  events$ = this.store.select(selectEvents);
  selectedEvent$ = this.store.select(selectSelectedEvent);
  currentPeriod$ = this.store.select(selectCurrentPeriod);
  
  progress: LearningProgress[] = [];
  achievements: Achievement[] = [];
  statistics = {
    totalEvents: 0,
    viewedEvents: 0,
    masteredEvents: 0,
    averageScore: 0,
    studyTime: 0 // in minutes
  };

  constructor(private store: Store) {}

  ngOnInit(): void {
    // Load progress from localStorage or initialize
    this.loadProgress();
    
    // Update progress when events change
    this.events$.subscribe(events => {
      this.updateStatistics(events);
    });
    
    // Track when an event is viewed
    this.selectedEvent$.subscribe(event => {
      if (event) {
        this.recordEventView(event.id);
      }
    });
  }

  loadProgress(): void {
    // Load from localStorage
    const savedProgress = localStorage.getItem('cap-map-progress');
    const savedAchievements = localStorage.getItem('cap-map-achievements');
    const savedStatistics = localStorage.getItem('cap-map-statistics');
    
    if (savedProgress) {
      this.progress = JSON.parse(savedProgress);
    }
    
    if (savedAchievements) {
      this.achievements = JSON.parse(savedAchievements);
    }
    
    if (savedStatistics) {
      this.statistics = JSON.parse(savedStatistics);
    }
    
    // Initialize default achievements if none exist
    if (this.achievements.length === 0) {
      this.initializeAchievements();
    }
  }

  saveProgress(): void {
    localStorage.setItem('cap-map-progress', JSON.stringify(this.progress));
    localStorage.setItem('cap-map-achievements', JSON.stringify(this.achievements));
    localStorage.setItem('cap-map-statistics', JSON.stringify(this.statistics));
  }

  initializeAchievements(): void {
    this.achievements = [
      { id: 'first-view', name: '第一次探索', description: '查看您的第一個歷史事件', icon: '👀', earned: false },
      { id: 'ten-events', name: '十連霸', description: '查看十個不同的歷史事件', icon: '🔟', earned: false },
      { id: 'history-buff', name: '歷史通', description: '查看五十個不同的歷史事件', icon: '📚', earned: false },
      { id: 'map-master', name: '地圖達人', description: '在正確地點點擊二十個歷史事件', icon: '🗺️', earned: false },
      { id: 'exam-ace', name: '會考高手', description: '在會考模式中達成百分之八十以上的正確率', icon: '🏆', earned: false },
      { id: 'timeline-expert', name: '時間軸專家', description: '正確排序十個歷史事件的時間順序', icon: '⏳', earned: false }
    ];
  }

  recordEventView(eventId: string): void {
    const progressIndex = this.progress.findIndex(p => p.eventId === eventId);
    const now = new Date().toISOString();
    
    if (progressIndex >= 0) {
      // Update existing progress
      this.progress[progressIndex].viewedCount++;
      this.progress[progressIndex].lastViewed = now;
    } else {
      // Create new progress entry
      this.progress.push({
        eventId,
        viewedCount: 1,
        lastViewed: now,
        mastered: false,
        examScore: 0
      });
    }
    
    this.updateStatistics([]);
    this.checkAchievements();
    this.saveProgress();
  }

  updateStatistics(events: any[]): void {
    this.statistics.totalEvents = events.length;
    this.statistics.viewedEvents = this.progress.filter(p => p.viewedCount > 0).length;
    this.statistics.masteredEvents = this.progress.filter(p => p.mastered).length;
    
    // Calculate average exam score
    const scoredEvents = this.progress.filter(p => p.examScore > 0);
    if (scoredEvents.length > 0) {
      this.statistics.averageScore = Math.round(
        scoredEvents.reduce((sum, p) => sum + p.examScore, 0) / scoredEvents.length
      );
    } else {
      this.statistics.averageScore = 0;
    }
    
    // Study time would be tracked via timestamps in a real implementation
    this.statistics.studyTime = 0; // Placeholder
    
    this.saveProgress();
  }

  checkAchievements(): void {
    // First view achievement
    if (!this.achievements.find(a => a.id === 'first-view')?.earned && 
        this.progress.some(p => p.viewedCount > 0)) {
      this.achievements.find(a => a.id === 'first-view')!.earned = true;
      this.achievements.find(a => a.id === 'first-view')!.earnedDate = new Date().toISOString();
    }
    
    // Ten events achievement
    if (!this.achievements.find(a => a.id === 'ten-events')?.earned && 
        this.progress.filter(p => p.viewedCount > 0).length >= 10) {
      this.achievements.find(a => a.id === 'ten-events')!.earned = true;
      this.achievements.find(a => a.id === 'ten-events')!.earnedDate = new Date().toISOString();
    }
    
    // History buff achievement
    if (!this.achievements.find(a => a.id === 'history-buff')?.earned && 
        this.progress.filter(p => p.viewedCount > 0).length >= 50) {
      this.achievements.find(a => a.id === 'history-buff')!.earned = true;
      this.achievements.find(a => a.id === 'history-buff')!.earnedDate = new Date().toISOString();
    }
    
    // Save after checking achievements
    this.saveProgress();
  }

  toggleMastery(eventId: string): void {
    const progressIndex = this.progress.findIndex(p => p.eventId === eventId);
    if (progressIndex >= 0) {
      this.progress[progressIndex].mastered = !this.progress[progressIndex].mastered;
      this.updateStatistics([]);
      this.saveProgress();
    }
  }

  get masteryPercentage(): number {
    if (this.progress.length === 0) return 0;
    const masteredCount = this.progress.filter(p => p.mastered).length;
    return Math.round((masteredCount / this.progress.length) * 100);
  }
}
```

- [ ] **Step 3: Create HTML template**

```html
<div class="progress-tracker">
  <div class="tracker-header">
    <h2>學習進度追蹤</h2>
  </div>
  
  <div class="progress-stats">
    <div class="stat-item">
      <div class="stat-value">{{ statistics.viewedEvents }}</div>
      <div class="stat-label">已學習事件</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ statistics.masteredEvents }}</div>
      <div class="stat-label">已掌握事件</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ statistics.averageScore }}%</div>
      <div class="stat-label">平均考試分數</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ masteryPercentage }}%</div>
      <div class="stat-label">掌握度</div>
    </div>
  </div>
  
  <div class="mastery-progress">
    <div class="progress-label">整體掌握進度</div>
    <div class="progress-bar-container">
      <div class="progress-bar" [style.width.%]="masteryPercentage"></div>
    </div>
    <div class="progress-text">
      {{ masteryPercentage }}% 完成 ({{ progress.filter(p => p.mastered).length }} / {{ progress.length }})
    </div>
  </div>
  
  <div class="achievements-section">
    <h3>成就系統</h3>
    <div class="achievements-grid">
      <div *ngFor="let achievement of achievements" 
           class="achievement-card"
           [class.earned]="achievement.earned">
        <div class="achievement-icon">{{ achievement.icon }}</div>
        <div class="achievement-info">
          <h4>{{ achievement.name }}</h4>
          <p>{{ achievement.description }}</p>
          <div *ngIf="achievement.earned" class="achievement-date">
            獲得於: {{ achievement.earnedDate | date:'mediumDate' }}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="recent-activity">
    <h3>最近學習記錄</h3>
    <div class="activity-list" *ngIf="progress.length > 0">
      <div *ngFor="let progressItem of progress.slice(0, 5).reverse()" 
           class="activity-item">
        <div class="activity-info">
          <span class="activity-count">第 {{ progressItem.viewedCount }} 次查看</span>
          <span class="activity-date">{{ progressItem.lastViewed | date:'short' }}</span>
        </div>
        <!-- Event name would be looked up from events list -->
        <div class="event-name">[事件名稱]</div>
        <div class="mastery-status" 
            [class.mastered]="progressItem.mastered">
          {{ progressItem.mastered ? '已掌握' : '學習中' }}
        </div>
      </div>
    </div>
    <div *ngIf="progress.length === 0" class="no-activity">
      尚無學習記錄，開始探索歷史事件吧！
    </div>
  </div>
  
  <div class="mastery-controls">
    <button class="btn btn-outline-secondary" 
            (click)="resetProgress()">
      重置進度
    </button>
  </div>
</div>
```

- [ ] **Step 4: Add CSS styling**

```css
.progress-tracker {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.tracker-header {
  margin-bottom: 1.5rem;
}

.tracker-header h2 {
  margin: 0;
  color: #333;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.mastery-progress {
  margin-bottom: 1.5rem;
}

.progress-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.progress-bar-container {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.achievements-section {
  margin-bottom: 1.5rem;
}

.achievements-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.achievement-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.achievement-card.earned {
  border-color: #28a745;
  background-color: #f8fff9;
}

.achievement-card:not(.earned) {
  opacity: 0.7;
  filter: grayscale(0.3);
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.achievement-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.achievement-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

.achievement-date {
  font-size: 0.75rem;
  color: #28a745;
  font-weight: 500;
}

.recent-activity {
  margin-bottom: 1.5rem;
}

.recent-activity h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.activity-info {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.activity-count {
  background-color: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.activity-date {
  color: #666;
}

.event-name {
  font-weight: 500;
  min-width: 120px;
}

.mastery-status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: 500;
}

.mastery-status.mastered {
  background-color: #d4edda;
  color: #155724;
}

.mastery-status:not(.mastered) {
  background-color: #fff3cd;
  color: #856404;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.mastery-controls {
  text-align: center;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: white;
}

.btn-outline-secondary:hover {
  color: white;
  background-color: #6c757d;
  border-color: #6c757d;
}
```

- [ ] **Step 5: Update app component to include progress tracker**

Modify: `src/app/app.component.html:1-7`

```html
<app-search-bar></app-search-bar>
<app-map-container></app-map-container>
<app-timeline></app-timeline>
<app-event-sidebar></app-event-sidebar>
<app-layer-control></app-layer-control>
<app-exam-mode *ngIf="showExamMode"></app-exam-mode>
<app-progress-tracker></app-progress-tracker>
<button class="exam-toggle-btn" (click)="toggleExamMode()">
  {{ showExamMode ? '返回學習模式' : '進入會考練習' }}
</button>
```

- [ ] **Step 6: Run application to verify progress tracker**

Run: `ng serve`
Expected: Progress tracker visible, showing statistics and achievements

- [ ] **Step 7: Commit progress tracker component**

```bash
git add src/app/progress-tracker/ src/app/app.component.html
git commit -m "feat: implement progress tracker component with achievements"
```