# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 最重要規則

**Git commit 訊息絕對不可包含 `Co-Authored-By: Claude` 或任何 AI 署名資訊。** 只寫功能描述，不附加任何尾行。

## Project Overview

**cap-map** is a Taiwan historical geography map application for studying social studies. It shows 33+ historical events on a Leaflet map, filtered by a horizontal timeline spanning from 5000 BCE to 2025 CE. Clicking an event opens a sidebar with details and an auto-generated quiz.

The Angular app lives in the `webapp/` subdirectory. All commands below should be run from `cap-map/webapp/`.

## Commands

```bash
# Development server (http://localhost:4200)
npm start

# Production build (output: dist/)
npm run build

# Run unit tests (Karma + Jasmine)
npm test
```

Generate a new component:
```bash
ng generate component component-name
```

## Architecture

### NgRx State (three slices)

The store is defined in `src/app/store/app.state.ts`. Three independent slices:

| Slice | Key state | Purpose |
|---|---|---|
| `event` | `events[]`, `selectedEventId` | Master list loaded from JSON; tracks which event is selected |
| `map` | `events[]`, `selectedEventId`, `activeLayers[]` | Filtered view of events displayed on the Leaflet map |
| `timeline` | `periods[]`, `currentPeriodId` | Timeline periods; drives event filtering |

**Critical data flow**: `TimelineComponent` subscribes to both `selectEvents` and `selectCurrentPeriodId` via `combineLatest`, filters the master event list by `date.periodId`, then dispatches `MapActions.setMapEvents` to push the filtered list to the map slice. The map never reads from the event slice directly.

### Components

- **`AppComponent`** — Root shell; hosts all components and an `examMode` toggle flag
- **`MapContainerComponent`** — Initialises Leaflet, renders markers from `map.events`, dispatches both `map/selectEvent` and `event/selectEvent` on marker click
- **`TimelineComponent`** — Horizontal scroll track, -5000 to 2025 at 5px/year; period bands + event dots; period click dispatches `timeline/setCurrentPeriod`
- **`EventSidebarComponent`** — Shows selected event details and a 3-question quiz; close button clears both `event/selectedEventId` and `map/selectedEventId`
- **`SearchBarComponent`** — Fuzzy search via Fuse.js (keys: `title`, `description`, `keywords`; threshold 0.3)
- **`LayerControlComponent`** — Slide-out panel; toggles named layer IDs in `map.activeLayers` (layers are UI-only; no actual tile sources wired yet)

### Services

- **`EventService`** — Fetches `assets/data/events.json` via HttpClient and dispatches load actions
- **`TimelineService`** — Fetches `assets/data/timeline.json`
- **`QuizService`** — Generates up to 3 questions per event from four types: period, location, keyword, sequence

### Data files

- `src/assets/data/events.json` — Each event has: `id`, `title`, `description`, `date` (`start`, `end`, `period`, `periodId`), `location` (`name`, `coordinates [lat, lng]`, `adminDivisions`), `categories`, `keywords`, `relatedEvents`, `examRelevance`
- `src/assets/data/timeline.json` — Eight periods: `prehistory`, `dutch-spanish`, `zhengshi`, `qing-rule`, `japanese-rule`, `postwar`, `democratization`, `modern`

## Important Conventions

- **All components use `standalone: false`** (NgModule pattern). Do not create standalone components; declare them in `AppModule` instead.
- Event selection has two parallel actions that must both be dispatched: `EventActions.selectEvent` (updates `event` slice) and `MapActions.selectEvent` (updates `map` slice). Same for clear.
- Map coordinates are `[lat, lng]` arrays (not GeoJSON `[lng, lat]` order).
- Timeline year positions: `pixelX = (year - minYear) * pixelsPerYear` where `minYear = -5000`, `pixelsPerYear = 5`.
