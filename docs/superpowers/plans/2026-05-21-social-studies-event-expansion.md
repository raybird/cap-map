# 國中社會科時空事件擴充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the CAP-Map event dataset from Taiwan-only coverage into a junior-high social studies history backbone covering Taiwan, China, and world history while keeping the app's map-and-timeline experience intact.

**Architecture:** Keep the existing JSON-driven architecture. Extend the dataset in `webapp/public/assets/data/events.json`, generalize `webapp/public/assets/data/timeline.json` from Taiwan-specific dynasties to broader cross-region eras, and harden the data pipeline with a validator plus small quiz-service adjustments so the larger event corpus still behaves correctly.

**Tech Stack:** Angular 20, TypeScript, Node.js, JSON data files, NgRx, Leaflet

---

## File Map

- Modify: `webapp/public/assets/data/events.json`
  Purpose: add new China/world/Taiwan events, normalize period labels and textbook references, maintain related event links.
- Modify: `webapp/public/assets/data/timeline.json`
  Purpose: replace Taiwan-only periods with broader eras that can hold Taiwan, China, and world history together.
- Modify: `webapp/src/app/services/quiz.service.ts`
  Purpose: stop relying on hard-coded Taiwan-era/keyword pools so quizzes remain valid after the dataset expands.
- Modify: `webapp/package.json`
  Purpose: add a data validation script for repeatable verification.
- Create: `webapp/scripts/validate-events.mjs`
  Purpose: verify event schema integrity, period linkage, related event linkage, coordinates, and textbook reference format.

### Task 1: Generalize the Timeline and Add Dataset Validation

**Files:**
- Create: `webapp/scripts/validate-events.mjs`
- Modify: `webapp/package.json`
- Modify: `webapp/public/assets/data/timeline.json`
- Modify: `webapp/public/assets/data/events.json`
- Modify: `webapp/src/app/services/quiz.service.ts`

- [ ] **Step 1: Write the failing dataset validator**

Create `webapp/scripts/validate-events.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventsPath = path.join(root, 'public/assets/data/events.json');
const timelinePath = path.join(root, 'public/assets/data/timeline.json');

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const periods = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));

const periodMap = new Map(periods.map((period) => [period.id, period]));
const eventIds = new Set();
const errors = [];
const textbookRefPattern = /^社會科[七八九]年級[上下]冊 (臺灣史|臺灣近現代史|中國史|世界史)$/;

function parseYear(dateStr) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return null;
  if (dateStr.startsWith('-')) {
    const year = Number.parseInt(dateStr.slice(1).split('-')[0], 10);
    return Number.isNaN(year) ? null : -year;
  }
  const year = Number.parseInt(dateStr.split('-')[0], 10);
  return Number.isNaN(year) ? null : year;
}

for (const event of events) {
  if (!event.id || typeof event.id !== 'string') {
    errors.push('Event without valid id');
    continue;
  }

  if (eventIds.has(event.id)) {
    errors.push(`Duplicate event id: ${event.id}`);
  }
  eventIds.add(event.id);

  if (!event.title || !event.description) {
    errors.push(`Missing title or description: ${event.id}`);
  }

  if (!event.date?.start || !event.date?.end || !event.date?.periodId || !event.date?.period) {
    errors.push(`Missing date fields: ${event.id}`);
    continue;
  }

  const startYear = parseYear(event.date.start);
  const endYear = parseYear(event.date.end);
  if (startYear === null || endYear === null || startYear > endYear) {
    errors.push(`Invalid date range: ${event.id}`);
  }

  const matchedPeriod = periodMap.get(event.date.periodId);
  if (!matchedPeriod) {
    errors.push(`Unknown periodId ${event.date.periodId} on ${event.id}`);
  } else {
    if (matchedPeriod.label !== event.date.period) {
      errors.push(`Period label mismatch on ${event.id}: ${event.date.periodId} -> ${event.date.period}`);
    }
    const isPrehistory = event.date.periodId === 'prehistory';
    const startsTooEarly = startYear !== null && startYear < matchedPeriod.startYear;
    const startsTooLate = startYear !== null && startYear > matchedPeriod.endYear;
    if ((!isPrehistory && startsTooEarly) || startsTooLate) {
      errors.push(`Start year ${startYear} outside period ${event.date.periodId} on ${event.id}`);
    }
  }

  const coords = event.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    errors.push(`Invalid coordinates: ${event.id}`);
  } else {
    const [lat, lng] = coords;
    if (typeof lat !== 'number' || lat < -90 || lat > 90 || typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push(`Coordinates out of range: ${event.id}`);
    }
  }

  if (!Array.isArray(event.relatedEvents)) {
    errors.push(`relatedEvents must be an array: ${event.id}`);
  }

  if (!Array.isArray(event.examRelevance?.textbookReferences) || event.examRelevance.textbookReferences.length === 0) {
    errors.push(`Missing textbookReferences: ${event.id}`);
  } else {
    for (const reference of event.examRelevance.textbookReferences) {
      if (!textbookRefPattern.test(reference)) {
        errors.push(`Invalid textbook reference on ${event.id}: ${reference}`);
      }
    }
  }
}

for (const event of events) {
  for (const relatedId of event.relatedEvents ?? []) {
    if (!eventIds.has(relatedId)) {
      errors.push(`Unknown related event ${relatedId} referenced by ${event.id}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Event data validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${events.length} events across ${periods.length} periods.`);
```

- [ ] **Step 2: Add the validation command**

Modify `webapp/package.json` scripts:

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:data": "node scripts/validate-events.mjs"
  }
}
```

- [ ] **Step 3: Replace Taiwan-only periods with global eras**

Overwrite `webapp/public/assets/data/timeline.json`:

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
  },
  {
    "id": "ancient",
    "label": "古代文明",
    "startDate": "-1000-01-01",
    "endDate": "0600-12-31",
    "startYear": -1000,
    "endYear": 600,
    "color": "#C97C5D",
    "description": "古代帝國、文明核心與早期交流"
  },
  {
    "id": "medieval",
    "label": "中古交流",
    "startDate": "0601-01-01",
    "endDate": "1399-12-31",
    "startYear": 601,
    "endYear": 1399,
    "color": "#C06C84",
    "description": "中古世界的宗教、政權與跨區域交流"
  },
  {
    "id": "early-modern",
    "label": "近世交流",
    "startDate": "1400-01-01",
    "endDate": "1749-12-31",
    "startYear": 1400,
    "endYear": 1749,
    "color": "#6C5B7B",
    "description": "大航海、海上貿易與近世政權互動"
  },
  {
    "id": "industrial-age",
    "label": "近代變革",
    "startDate": "1750-01-01",
    "endDate": "1945-12-31",
    "startYear": 1750,
    "endYear": 1945,
    "color": "#355C7D",
    "description": "工業革命、帝國主義與近代戰爭"
  },
  {
    "id": "postwar",
    "label": "戰後時期",
    "startDate": "1946-01-01",
    "endDate": "1987-07-14",
    "startYear": 1946,
    "endYear": 1987,
    "color": "#99B898",
    "description": "第二次世界大戰後至臺灣解嚴前"
  },
  {
    "id": "democratization",
    "label": "民主化時期",
    "startDate": "1987-07-15",
    "endDate": "2000-05-19",
    "startYear": 1987,
    "endYear": 2000,
    "color": "#FECEAB",
    "description": "臺灣民主化進程與政治轉型"
  },
  {
    "id": "contemporary",
    "label": "當代",
    "startDate": "2000-05-20",
    "endDate": "2025-12-31",
    "startYear": 2000,
    "endYear": 2025,
    "color": "#A8E6CF",
    "description": "二十一世紀以來的臺灣與世界發展"
  }
]
```

- [ ] **Step 4: Remap existing Taiwan events to the new period ids and labels**

In `webapp/public/assets/data/events.json`, apply these exact replacements everywhere they appear:

```json
{ "period": "荷西時期", "periodId": "dutch-spanish" }
```

becomes

```json
{ "period": "近世交流", "periodId": "early-modern" }
```

```json
{ "period": "鄭氏時期", "periodId": "zhengshi" }
```

becomes

```json
{ "period": "近世交流", "periodId": "early-modern" }
```

```json
{ "period": "清治時期", "periodId": "qing-rule" }
```

becomes

```json
{ "period": "近代變革", "periodId": "industrial-age" }
```

```json
{ "period": "日治時期", "periodId": "japanese-rule" }
```

becomes

```json
{ "period": "近代變革", "periodId": "industrial-age" }
```

```json
{ "period": "戰後時期", "periodId": "postwar" }
```

stays

```json
{ "period": "戰後時期", "periodId": "postwar" }
```

```json
{ "period": "民主化時期", "periodId": "democratization" }
```

stays

```json
{ "period": "民主化時期", "periodId": "democratization" }
```

```json
{ "period": "當代", "periodId": "modern" }
```

becomes

```json
{ "period": "當代", "periodId": "contemporary" }
```
```

Also update the existing `wwii-taiwan` entry so its `date.period` and `date.periodId` match the war-era timeline bucket:

```json
{ "period": "戰後時期", "periodId": "postwar" }
```

becomes

```json
{ "period": "近代變革", "periodId": "industrial-age" }
```

- [ ] **Step 5: Make quiz period and keyword distractors dynamic**

Modify `webapp/src/app/services/quiz.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { HistoricalEvent } from '../models/event.model';

export interface QuizQuestion {
  id: string;
  type: 'period' | 'location' | 'keyword' | 'sequence';
  question: string;
  options: string[];
  correctAnswer: string;
}

@Injectable({ providedIn: 'root' })
export class QuizService {

  generateQuestions(event: HistoricalEvent, allEvents: HistoricalEvent[]): QuizQuestion[] {
    if (!event) return [];
    const questions: QuizQuestion[] = [];

    const periodQ = this.buildPeriodQuestion(event, allEvents);
    if (periodQ) questions.push(periodQ);

    const locationQ = this.buildLocationQuestion(event, allEvents);
    if (locationQ) questions.push(locationQ);

    const keywordQ = this.buildKeywordQuestion(event, allEvents);
    if (keywordQ) questions.push(keywordQ);

    const sequenceQ = this.buildSequenceQuestion(event, allEvents);
    if (sequenceQ) questions.push(sequenceQ);

    return this.shuffle(questions).slice(0, 3);
  }

  private buildPeriodQuestion(event: HistoricalEvent, allEvents: HistoricalEvent[]): QuizQuestion | null {
    if (!event.date?.period) return null;
    const correct = event.date.period;
    const pool = [...new Set(allEvents.map((item) => item.date?.period).filter(Boolean))] as string[];
    const distractors = this.shuffle(pool.filter((period) => period !== correct)).slice(0, 3);
    if (distractors.length < 3) return null;
    const options = this.shuffle([...distractors, correct]);
    return {
      id: `period-${event.id}`,
      type: 'period',
      question: `「${event.title}」發生於哪個時期？`,
      options,
      correctAnswer: correct
    };
  }

  private buildLocationQuestion(event: HistoricalEvent, allEvents: HistoricalEvent[]): QuizQuestion | null {
    if (!event.location?.name) return null;
    const correct = event.location.name;
    const others = allEvents
      .filter((item) => item.id !== event.id && item.location?.name && item.location.name !== correct)
      .map((item) => item.location.name);
    const picked = this.shuffle([...new Set(others)]).slice(0, 3);
    if (picked.length < 3) return null;
    return {
      id: `location-${event.id}`,
      type: 'location',
      question: `「${event.title}」發生在何處？`,
      options: this.shuffle([...picked, correct]),
      correctAnswer: correct
    };
  }

  private buildKeywordQuestion(event: HistoricalEvent, allEvents: HistoricalEvent[]): QuizQuestion | null {
    const keywords = event.keywords || [];
    if (keywords.length === 0) return null;
    const correct = this.pickRandom(keywords) as string;
    const keywordPool = [...new Set(allEvents.flatMap((item) => item.keywords || []))]
      .filter((keyword) => !keywords.includes(keyword));
    const picked = this.shuffle(keywordPool).slice(0, 3);
    if (picked.length < 3) return null;
    return {
      id: `keyword-${event.id}`,
      type: 'keyword',
      question: `以下哪個關鍵詞與「${event.title}」最相關？`,
      options: this.shuffle([...picked, correct]),
      correctAnswer: correct
    };
  }

  private buildSequenceQuestion(event: HistoricalEvent, allEvents: HistoricalEvent[]): QuizQuestion | null {
    const eventYear = this.parseYear(event.date?.start);
    if (eventYear === null) return null;

    const next = allEvents
      .filter((item) => item.id !== event.id)
      .map((item) => ({ event: item, year: this.parseYear(item.date?.start) }))
      .filter((item) => item.year !== null && item.year > eventYear)
      .sort((a, b) => (a.year as number) - (b.year as number))[0]?.event;

    if (!next) return null;

    const distractors = this.shuffle(
      allEvents
        .filter((item) => item.id !== event.id && item.id !== next.id)
        .map((item) => item.title)
    ).slice(0, 3);
    if (distractors.length < 3) return null;

    return {
      id: `sequence-${event.id}`,
      type: 'sequence',
      question: `「${event.title}」之後緊接著哪個事件？`,
      options: this.shuffle([...distractors, next.title]),
      correctAnswer: next.title
    };
  }

  private parseYear(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    if (dateStr.startsWith('-')) {
      const year = parseInt(dateStr.substring(1).split('-')[0], 10);
      return isNaN(year) ? null : -year;
    }
    const year = parseInt(dateStr.split('-')[0], 10);
    return isNaN(year) ? null : year;
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
```

- [ ] **Step 6: Run the data validator to confirm it now fails only on textbook references**

Run: `npm run test:data`

Expected: FAIL with errors matching the old chapter-based textbook references, but no errors about missing period ids such as `dutch-spanish`, `zhengshi`, `qing-rule`, `japanese-rule`, or `modern`.

- [ ] **Step 7: Run the production build to verify timeline and quiz code still compile**

Run: `npm run build`

Expected: Angular build succeeds. Existing style/CommonJS warnings may remain, but there should be no TypeScript errors.

- [ ] **Step 8: Commit the generalized timeline and validation foundation**

```bash
git add webapp/scripts/validate-events.mjs webapp/package.json webapp/public/assets/data/timeline.json webapp/public/assets/data/events.json webapp/src/app/services/quiz.service.ts
git commit -m "chore: generalize timeline and validate event data"
```

### Task 2: Add the China History Backbone Events

**Files:**
- Modify: `webapp/public/assets/data/events.json`

- [ ] **Step 1: Append the China history events**

Add these objects to `webapp/public/assets/data/events.json`:

```json
{
  "id": "yellow-river-agriculture",
  "title": "黃河與長江流域農業發展",
  "description": "中國早期農業文明在黃河與長江流域發展，逐漸形成定居聚落與社會分工，是中國古代文明的基礎。",
  "date": { "start": "-3000-01-01", "end": "-2000-01-01", "period": "史前時代", "periodId": "prehistory" },
  "location": { "name": "黃河與長江流域", "coordinates": [34.5, 112.5], "adminDivisions": ["中國"] },
  "categories": ["歷史", "地理"],
  "keywords": ["農業起源", "黃河", "長江", "聚落", "文明起源"],
  "relatedEvents": ["shang-bronze-civilization", "qin-unification"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "shang-bronze-civilization",
  "title": "商朝青銅文明",
  "description": "商朝在黃河流域發展成熟的青銅器文化與王權政治，甲骨文也成為研究中國早期歷史的重要材料。",
  "date": { "start": "-1600-01-01", "end": "-1046-01-01", "period": "史前時代", "periodId": "prehistory" },
  "location": { "name": "殷墟（今河南安陽）", "coordinates": [36.12, 114.32], "adminDivisions": ["中國", "河南省", "安陽市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["商朝", "青銅器", "甲骨文", "殷墟"],
  "relatedEvents": ["yellow-river-agriculture", "qin-unification"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "圖表判讀"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "qin-unification",
  "title": "秦始皇統一六國",
  "description": "秦王嬴政於西元前221年統一六國，建立中國第一個大一統帝國，並推動文字、度量衡與道路制度整合。",
  "date": { "start": "-221-01-01", "end": "-210-01-01", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "咸陽", "coordinates": [34.34, 108.71], "adminDivisions": ["中國", "陝西省", "咸陽市"] },
  "categories": ["歷史"],
  "keywords": ["秦始皇", "統一六國", "郡縣制", "度量衡"],
  "relatedEvents": ["shang-bronze-civilization", "han-silk-road"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "han-silk-road",
  "title": "漢朝開通絲路",
  "description": "漢代張騫出使西域後，陸上絲路逐漸形成，促進中國與中亞、西亞之間的商貿與文化交流。",
  "date": { "start": "-138-01-01", "end": "0220-12-31", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "長安", "coordinates": [34.26, 108.95], "adminDivisions": ["中國", "陝西省", "西安市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["漢朝", "絲路", "張騫", "西域", "貿易"],
  "relatedEvents": ["qin-unification", "buddhism-china"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "因果分析"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "buddhism-china",
  "title": "佛教傳入中國",
  "description": "佛教沿絲路傳入中國後，逐步影響思想、藝術與社會文化，成為中國中古時期的重要宗教力量。",
  "date": { "start": "0067-01-01", "end": "0589-12-31", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "白馬寺（今河南洛陽）", "coordinates": [34.72, 112.62], "adminDivisions": ["中國", "河南省", "洛陽市"] },
  "categories": ["歷史"],
  "keywords": ["佛教", "白馬寺", "絲路", "宗教傳播"],
  "relatedEvents": ["han-silk-road", "sui-grand-canal"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "sui-grand-canal",
  "title": "隋朝開鑿大運河",
  "description": "隋朝為了整合南北交通與糧食運輸而開鑿大運河，強化中央控制，也成為後世重要水運系統。",
  "date": { "start": "0605-01-01", "end": "0610-12-31", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "洛陽", "coordinates": [34.62, 112.45], "adminDivisions": ["中國", "河南省", "洛陽市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["隋朝", "大運河", "南北交通", "中央集權"],
  "relatedEvents": ["buddhism-china", "tang-changan-exchange"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "tang-changan-exchange",
  "title": "唐代長安與東亞交流",
  "description": "唐代長安是東亞重要國際都市，日本、新羅與西域使節雲集，展現中古時期中國對外交流的高度發展。",
  "date": { "start": "0618-01-01", "end": "0907-12-31", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "長安（今西安）", "coordinates": [34.26, 108.95], "adminDivisions": ["中國", "陝西省", "西安市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["唐朝", "長安", "遣唐使", "國際都市"],
  "relatedEvents": ["sui-grand-canal", "song-commercial-revolution"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "song-commercial-revolution",
  "title": "宋代商業繁榮",
  "description": "宋代城市經濟與海外貿易發展快速，市民社會與貨幣流通更為活絡，被視為中國古代商業高度發展的時期。",
  "date": { "start": "0960-01-01", "end": "1279-12-31", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "開封", "coordinates": [34.8, 114.3], "adminDivisions": ["中國", "河南省", "開封市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["宋朝", "商業", "市舶司", "紙幣", "城市發展"],
  "relatedEvents": ["tang-changan-exchange", "yuan-empire"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "yuan-empire",
  "title": "元朝建立與跨域統治",
  "description": "忽必烈建立元朝後，中國首次由北方草原政權長期統治全境，並與歐亞大陸形成更緊密的交通與交流。",
  "date": { "start": "1271-01-01", "end": "1368-09-14", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "大都（今北京）", "coordinates": [39.9, 116.4], "adminDivisions": ["中國", "北京市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["元朝", "忽必烈", "蒙古帝國", "歐亞交流"],
  "relatedEvents": ["song-commercial-revolution", "zheng-he-voyages"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋", "圖表判讀"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "zheng-he-voyages",
  "title": "鄭和下西洋",
  "description": "明成祖派鄭和七次下西洋，展現明朝海上實力，也促進中國與東南亞、南亞、東非的交流。",
  "date": { "start": "1405-01-01", "end": "1433-12-31", "period": "近世交流", "periodId": "early-modern" },
  "location": { "name": "南京", "coordinates": [32.06, 118.78], "adminDivisions": ["中國", "江蘇省", "南京市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["鄭和", "下西洋", "朝貢", "海上交流"],
  "relatedEvents": ["yuan-empire", "age-of-discovery"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "opium-war",
  "title": "鴉片戰爭",
  "description": "英國與清朝因通商與鴉片問題爆發戰爭，清朝戰敗後簽訂不平等條約，成為中國近代史的重要轉折。",
  "date": { "start": "1839-01-01", "end": "1842-08-29", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "廣州", "coordinates": [23.13, 113.26], "adminDivisions": ["中國", "廣東省", "廣州市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["鴉片戰爭", "不平等條約", "近代化", "通商口岸"],
  "relatedEvents": ["zheng-he-voyages", "first-sino-japanese-war", "dagou-port"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "概念解釋"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "first-sino-japanese-war",
  "title": "甲午戰爭",
  "description": "清朝與日本因朝鮮問題爆發甲午戰爭，清朝戰敗後簽訂馬關條約，深刻影響東亞局勢與臺灣命運。",
  "date": { "start": "1894-07-25", "end": "1895-04-17", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "威海衛", "coordinates": [37.5, 122.12], "adminDivisions": ["中國", "山東省", "威海市"] },
  "categories": ["歷史", "地理"],
  "keywords": ["甲午戰爭", "清朝", "日本", "馬關條約"],
  "relatedEvents": ["opium-war", "japanese-1895", "taiwan-republic"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級上冊 中國史"] }
},
{
  "id": "xinhai-revolution",
  "title": "辛亥革命",
  "description": "武昌起義引發辛亥革命，推翻清朝，建立中華民國，象徵中國帝制結束與近代政治轉型。",
  "date": { "start": "1911-10-10", "end": "1912-02-12", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "武昌", "coordinates": [30.55, 114.31], "adminDivisions": ["中國", "湖北省", "武漢市"] },
  "categories": ["歷史"],
  "keywords": ["辛亥革命", "武昌起義", "中華民國", "清朝滅亡"],
  "relatedEvents": ["first-sino-japanese-war", "opium-war"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級上冊 中國史"] }
}
```

- [ ] **Step 2: Run validation after the China batch**

Run: `npm run test:data`

Expected: PASS for newly added China events. If it fails, fix period labels, coordinates, or related event ids before continuing.

- [ ] **Step 3: Run build after the China batch**

Run: `npm run build`

Expected: Angular build succeeds and the app still compiles with the larger event dataset.

- [ ] **Step 4: Commit the China batch**

```bash
git add webapp/public/assets/data/events.json
git commit -m "feat: add China history backbone events"
```

### Task 3: Add the World History Backbone Events

**Files:**
- Modify: `webapp/public/assets/data/events.json`

- [ ] **Step 1: Append the world history events**

Add these objects to `webapp/public/assets/data/events.json`:

```json
{
  "id": "mesopotamia-civilization",
  "title": "兩河文明發展",
  "description": "幼發拉底河與底格里斯河流域發展出早期城市文明，出現文字、法典與灌溉農業，是世界古文明的重要起點。",
  "date": { "start": "-3500-01-01", "end": "-539-01-01", "period": "史前時代", "periodId": "prehistory" },
  "location": { "name": "兩河流域", "coordinates": [33.22, 44.36], "adminDivisions": ["伊拉克"] },
  "categories": ["歷史", "地理"],
  "keywords": ["兩河文明", "楔形文字", "漢摩拉比法典", "城市文明"],
  "relatedEvents": ["ancient-egypt", "athens-democracy"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "ancient-egypt",
  "title": "古埃及文明",
  "description": "尼羅河流域發展出古埃及文明，法老統治、金字塔與象形文字皆是其代表特色。",
  "date": { "start": "-3100-01-01", "end": "-30-01-01", "period": "史前時代", "periodId": "prehistory" },
  "location": { "name": "吉薩金字塔", "coordinates": [29.98, 31.13], "adminDivisions": ["埃及"] },
  "categories": ["歷史", "地理"],
  "keywords": ["古埃及", "尼羅河", "金字塔", "法老"],
  "relatedEvents": ["mesopotamia-civilization", "roman-empire"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "athens-democracy",
  "title": "雅典民主政治發展",
  "description": "古希臘雅典逐步發展出公民參與政治的制度，成為後世民主政治的重要歷史來源。",
  "date": { "start": "-508-01-01", "end": "-322-01-01", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "雅典", "coordinates": [37.98, 23.72], "adminDivisions": ["希臘"] },
  "categories": ["歷史", "公民"],
  "keywords": ["雅典", "民主政治", "公民", "城邦"],
  "relatedEvents": ["mesopotamia-civilization", "roman-empire"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "價值辨析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "roman-empire",
  "title": "羅馬帝國興起",
  "description": "羅馬由共和走向帝國，建立橫跨歐洲、北非與西亞的大帝國，深刻影響法律、道路與城市文化。",
  "date": { "start": "-27-01-01", "end": "0476-09-04", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "羅馬", "coordinates": [41.89, 12.49], "adminDivisions": ["義大利"] },
  "categories": ["歷史", "地理"],
  "keywords": ["羅馬帝國", "法治", "道路", "地中海"],
  "relatedEvents": ["athens-democracy", "christianity-expansion"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "圖表判讀"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "christianity-expansion",
  "title": "基督教傳播",
  "description": "基督教從巴勒斯坦地區發展並在羅馬帝國內擴散，之後成為歐洲中古社會的重要精神力量。",
  "date": { "start": "0030-01-01", "end": "0600-12-31", "period": "古代文明", "periodId": "ancient" },
  "location": { "name": "耶路撒冷", "coordinates": [31.78, 35.22], "adminDivisions": ["以色列"] },
  "categories": ["歷史"],
  "keywords": ["基督教", "耶路撒冷", "羅馬帝國", "宗教傳播"],
  "relatedEvents": ["roman-empire", "islam-expansion"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "islam-expansion",
  "title": "伊斯蘭文明擴張",
  "description": "伊斯蘭教創立後迅速向西亞、北非與伊比利半島擴張，形成連接歐亞非的重要文明網絡。",
  "date": { "start": "0622-01-01", "end": "0750-12-31", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "麥加", "coordinates": [21.42, 39.83], "adminDivisions": ["沙烏地阿拉伯"] },
  "categories": ["歷史", "地理"],
  "keywords": ["伊斯蘭", "麥加", "阿拉伯帝國", "文明交流"],
  "relatedEvents": ["christianity-expansion", "crusades"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "crusades",
  "title": "十字軍東征",
  "description": "歐洲基督教世界多次向聖地發動十字軍東征，雖未長期控制耶路撒冷，卻促進東西方接觸。",
  "date": { "start": "1096-01-01", "end": "1291-08-12", "period": "中古交流", "periodId": "medieval" },
  "location": { "name": "耶路撒冷", "coordinates": [31.78, 35.22], "adminDivisions": ["以色列"] },
  "categories": ["歷史", "地理"],
  "keywords": ["十字軍", "耶路撒冷", "宗教衝突", "東西交流"],
  "relatedEvents": ["islam-expansion", "renaissance"],
  "examRelevance": { "importance": "medium", "questionTypes": ["因果分析", "概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "renaissance",
  "title": "文藝復興",
  "description": "義大利城市興起的文藝復興強調人文精神與古典文化再發現，帶動歐洲思想、藝術與學術轉變。",
  "date": { "start": "1350-01-01", "end": "1600-12-31", "period": "近世交流", "periodId": "early-modern" },
  "location": { "name": "佛羅倫斯", "coordinates": [43.77, 11.25], "adminDivisions": ["義大利"] },
  "categories": ["歷史"],
  "keywords": ["文藝復興", "人文主義", "佛羅倫斯", "歐洲轉型"],
  "relatedEvents": ["crusades", "age-of-discovery"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "age-of-discovery",
  "title": "地理大發現",
  "description": "歐洲各國在十五、十六世紀進行遠洋航行，開啟新航路，改變全球貿易、殖民與文化交流格局。",
  "date": { "start": "1488-01-01", "end": "1522-12-31", "period": "近世交流", "periodId": "early-modern" },
  "location": { "name": "里斯本", "coordinates": [38.72, -9.14], "adminDivisions": ["葡萄牙"] },
  "categories": ["歷史", "地理"],
  "keywords": ["地理大發現", "新航路", "殖民", "全球貿易"],
  "relatedEvents": ["renaissance", "dutch-zeelandia", "zheng-he-voyages"],
  "examRelevance": { "importance": "high", "questionTypes": ["圖表判讀", "因果分析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "reformation",
  "title": "宗教改革",
  "description": "馬丁路德發起宗教改革，衝擊天主教權威，也促成歐洲宗教與政治秩序的重整。",
  "date": { "start": "1517-10-31", "end": "1648-10-24", "period": "近世交流", "periodId": "early-modern" },
  "location": { "name": "威登堡", "coordinates": [51.87, 12.65], "adminDivisions": ["德國"] },
  "categories": ["歷史"],
  "keywords": ["宗教改革", "馬丁路德", "新教", "天主教"],
  "relatedEvents": ["renaissance", "scientific-revolution"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "scientific-revolution",
  "title": "科學革命",
  "description": "近代科學革命強調觀察與實驗，改變人們對自然世界的理解，也成為近代思想轉型的重要基礎。",
  "date": { "start": "1543-01-01", "end": "1700-12-31", "period": "近世交流", "periodId": "early-modern" },
  "location": { "name": "倫敦", "coordinates": [51.51, -0.13], "adminDivisions": ["英國"] },
  "categories": ["歷史"],
  "keywords": ["科學革命", "實驗", "哥白尼", "牛頓"],
  "relatedEvents": ["reformation", "industrial-revolution"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "industrial-revolution",
  "title": "工業革命",
  "description": "英國率先發生工業革命，機器生產與工廠制度改變經濟、社會與全球權力分布。",
  "date": { "start": "1760-01-01", "end": "1840-12-31", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "曼徹斯特", "coordinates": [53.48, -2.24], "adminDivisions": ["英國"] },
  "categories": ["歷史", "地理"],
  "keywords": ["工業革命", "工廠", "蒸汽機", "工業化"],
  "relatedEvents": ["scientific-revolution", "american-independence", "imperialism"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "american-independence",
  "title": "美國獨立戰爭",
  "description": "北美十三州反抗英國統治而爆發獨立戰爭，最終建立美國，成為近代民主革命的重要案例。",
  "date": { "start": "1775-04-19", "end": "1783-09-03", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "費城", "coordinates": [39.95, -75.16], "adminDivisions": ["美國", "賓夕法尼亞州"] },
  "categories": ["歷史", "公民"],
  "keywords": ["美國獨立", "民主革命", "十三州", "共和政治"],
  "relatedEvents": ["industrial-revolution", "french-revolution"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "價值辨析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "french-revolution",
  "title": "法國大革命",
  "description": "法國大革命衝擊舊制度，提出自由、平等、公民權等觀念，對歐洲與世界近代政治產生深遠影響。",
  "date": { "start": "1789-07-14", "end": "1799-11-09", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "巴黎", "coordinates": [48.86, 2.35], "adminDivisions": ["法國"] },
  "categories": ["歷史", "公民"],
  "keywords": ["法國大革命", "自由平等", "人權", "共和"],
  "relatedEvents": ["american-independence", "imperialism"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "imperialism",
  "title": "帝國主義擴張",
  "description": "十九世紀工業國家為了市場、原料與戰略利益展開殖民擴張，改變全球政治與經濟秩序。",
  "date": { "start": "1870-01-01", "end": "1914-07-27", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "柏林", "coordinates": [52.52, 13.4], "adminDivisions": ["德國"] },
  "categories": ["歷史", "地理"],
  "keywords": ["帝國主義", "殖民", "柏林會議", "工業國家"],
  "relatedEvents": ["industrial-revolution", "first-world-war"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "first-world-war",
  "title": "第一次世界大戰",
  "description": "歐洲列強衝突最終引爆第一次世界大戰，全面戰爭改變國際秩序，也加速帝國瓦解。",
  "date": { "start": "1914-07-28", "end": "1918-11-11", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "塞拉耶佛", "coordinates": [43.86, 18.41], "adminDivisions": ["波士尼亞與赫塞哥維納"] },
  "categories": ["歷史", "地理"],
  "keywords": ["第一次世界大戰", "同盟國", "協約國", "全面戰爭"],
  "relatedEvents": ["imperialism", "second-world-war"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "second-world-war",
  "title": "第二次世界大戰",
  "description": "第二次世界大戰席捲歐亞非，造成重大破壞與人員傷亡，也重新塑造戰後世界秩序。",
  "date": { "start": "1939-09-01", "end": "1945-09-02", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "華沙", "coordinates": [52.23, 21.01], "adminDivisions": ["波蘭"] },
  "categories": ["歷史", "地理"],
  "keywords": ["第二次世界大戰", "軸心國", "同盟國", "戰後秩序"],
  "relatedEvents": ["first-world-war", "un-founded", "wwii-taiwan"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "un-founded",
  "title": "聯合國成立",
  "description": "第二次世界大戰後，聯合國成立，期望透過國際合作維持和平並處理全球性問題。",
  "date": { "start": "1945-10-24", "end": "1945-10-24", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "舊金山", "coordinates": [37.77, -122.42], "adminDivisions": ["美國", "加州"] },
  "categories": ["歷史", "公民"],
  "keywords": ["聯合國", "國際合作", "戰後秩序", "和平"],
  "relatedEvents": ["second-world-war", "cold-war-begins"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋", "價值辨析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
},
{
  "id": "cold-war-begins",
  "title": "冷戰開始",
  "description": "第二次世界大戰後，美蘇對立逐漸形成冷戰格局，世界進入意識形態與陣營競爭的時代。",
  "date": { "start": "1947-03-12", "end": "1991-12-26", "period": "戰後時期", "periodId": "postwar" },
  "location": { "name": "柏林", "coordinates": [52.52, 13.4], "adminDivisions": ["德國"] },
  "categories": ["歷史", "地理"],
  "keywords": ["冷戰", "美蘇對立", "柏林", "意識形態"],
  "relatedEvents": ["un-founded", "martial-law"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科八年級下冊 世界史"] }
}
```

- [ ] **Step 2: Run validation after the world batch**

Run: `npm run test:data`

Expected: PASS for the world history additions. Fix any bad period ranges or unknown related ids before moving on.

- [ ] **Step 3: Run build after the world batch**

Run: `npm run build`

Expected: Angular build succeeds.

- [ ] **Step 4: Commit the world batch**

```bash
git add webapp/public/assets/data/events.json
git commit -m "feat: add world history backbone events"
```

### Task 4: Add Taiwan Supplements and Normalize Textbook References

**Files:**
- Modify: `webapp/public/assets/data/events.json`

- [ ] **Step 1: Normalize all existing textbook references to the new format**

Apply these replacements throughout `webapp/public/assets/data/events.json`:

```json
"社會科七年級上冊 第1章"
```

becomes

```json
"社會科七年級上冊 臺灣史"
```

```json
"社會科七年級上冊 第3章"
```

becomes

```json
"社會科七年級上冊 臺灣史"
```

```json
"社會科七年級下冊 第4章"
```

becomes

```json
"社會科七年級下冊 臺灣史"
```

```json
"社會科八年級上冊 第2章"
```

becomes

```json
"社會科九年級上冊 臺灣近現代史"
```

```json
"社會科八年級上冊 第3章"
```

becomes

```json
"社會科九年級上冊 臺灣近現代史"
```

```json
"社會科八年級下冊 第1章"
```

becomes

```json
"社會科九年級上冊 臺灣近現代史"
```

```json
"社會科八年級下冊 第2章"
```

becomes

```json
"社會科九年級上冊 臺灣近現代史"
```

```json
"社會科九年級上冊 第3章"
```

becomes

```json
"社會科九年級上冊 臺灣近現代史"
```

```json
"社會科九年級下冊 第2章"
```

becomes

```json
"社會科九年級下冊 臺灣近現代史"
```
```

- [ ] **Step 2: Update the existing modern Taiwan events instead of duplicating them**

Update these existing entries in `webapp/public/assets/data/events.json`:

```json
{
  "id": "feb28-incident",
  "examRelevance": { "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
}
```

```json
{
  "id": "martial-law",
  "title": "戒嚴令發布",
  "examRelevance": { "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
}
```

```json
{
  "id": "lift-martial-law",
  "title": "臺灣解嚴",
  "examRelevance": { "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
}
```

```json
{
  "id": "direct-election",
  "title": "首次總統直選",
  "examRelevance": { "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
}
```

```json
{
  "id": "power-transfer",
  "title": "首次政黨輪替",
  "examRelevance": { "textbookReferences": ["社會科九年級下冊 臺灣近現代史"] }
}
```

```json
{
  "id": "sunflower-movement",
  "examRelevance": { "textbookReferences": ["社會科九年級下冊 臺灣近現代史"] }
}
```

- [ ] **Step 3: Append only the missing Taiwan supplement events**

Add these objects to `webapp/public/assets/data/events.json`:

```json
{
  "id": "mudan-incident",
  "title": "牡丹社事件",
  "description": "琉球船民在臺灣南部遇害後，日本以此為由出兵臺灣，促使清廷更重視臺灣防務與治理。",
  "date": { "start": "1874-05-01", "end": "1874-12-31", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "牡丹社（今屏東縣牡丹鄉）", "coordinates": [22.15, 120.79], "adminDivisions": ["屏東縣", "牡丹鄉"] },
  "categories": ["歷史", "地理"],
  "keywords": ["牡丹社事件", "日本出兵", "琉球", "臺灣防務"],
  "relatedEvents": ["shen-baozhen-taiwan", "sino-french-war-taiwan"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科七年級下冊 臺灣史"] }
},
{
  "id": "shen-baozhen-taiwan",
  "title": "沈葆楨來臺與開山撫番",
  "description": "牡丹社事件後，清廷派沈葆楨來臺推動開山撫番、設防與交通建設，強化對臺治理。",
  "date": { "start": "1874-07-01", "end": "1875-12-31", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "恆春", "coordinates": [22.0, 120.74], "adminDivisions": ["屏東縣", "恆春鎮"] },
  "categories": ["歷史", "地理", "公民"],
  "keywords": ["沈葆楨", "開山撫番", "防務", "清廷治臺"],
  "relatedEvents": ["mudan-incident", "liu-mingchuan"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科七年級下冊 臺灣史"] }
},
{
  "id": "sino-french-war-taiwan",
  "title": "清法戰爭在臺灣",
  "description": "清法戰爭期間，法軍進攻基隆與淡水，臺灣防務的重要性提升，也成為之後建省的背景之一。",
  "date": { "start": "1884-08-01", "end": "1885-04-01", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "滬尾（今新北市淡水區）", "coordinates": [25.17, 121.44], "adminDivisions": ["新北市", "淡水區"] },
  "categories": ["歷史", "地理"],
  "keywords": ["清法戰爭", "基隆", "淡水", "臺灣防務"],
  "relatedEvents": ["mudan-incident", "liu-mingchuan", "tamsui-open"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "圖表判讀"], "textbookReferences": ["社會科七年級下冊 臺灣史"] }
},
{
  "id": "law-63",
  "title": "六三法",
  "description": "日本在臺實施六三法，授權總督府發布具有法律效力的命令，顯示殖民統治的高度集權性。",
  "date": { "start": "1896-03-31", "end": "1906-03-31", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "臺北", "coordinates": [25.04, 121.51], "adminDivisions": ["臺北市"] },
  "categories": ["歷史", "公民"],
  "keywords": ["六三法", "總督府", "殖民統治", "法律"],
  "relatedEvents": ["japanese-1895", "taiwan-republic"],
  "examRelevance": { "importance": "medium", "questionTypes": ["概念解釋", "價值辨析"], "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
},
{
  "id": "kominka-movement",
  "title": "皇民化運動",
  "description": "二戰前後日本在臺推動皇民化運動，透過語言、宗教與姓名政策強化殖民同化。",
  "date": { "start": "1937-07-07", "end": "1945-08-15", "period": "近代變革", "periodId": "industrial-age" },
  "location": { "name": "臺北", "coordinates": [25.04, 121.51], "adminDivisions": ["臺北市"] },
  "categories": ["歷史", "公民"],
  "keywords": ["皇民化", "同化政策", "日治", "殖民統治"],
  "relatedEvents": ["japanese-1895", "wwii-taiwan", "retrocession-taiwan"],
  "examRelevance": { "importance": "high", "questionTypes": ["概念解釋", "因果分析"], "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
},
{
  "id": "retrocession-taiwan",
  "title": "戰後接收臺灣",
  "description": "第二次世界大戰結束後，中華民國政府接收臺灣，臺灣正式脫離日本統治，進入戰後新局。",
  "date": { "start": "1945-10-25", "end": "1945-10-25", "period": "戰後時期", "periodId": "postwar" },
  "location": { "name": "臺北公會堂（今中山堂）", "coordinates": [25.04, 121.51], "adminDivisions": ["臺北市", "中正區"] },
  "categories": ["歷史", "公民"],
  "keywords": ["光復", "接收臺灣", "戰後", "政權轉移"],
  "relatedEvents": ["second-world-war", "feb28-incident"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "概念解釋"], "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
},
{
  "id": "formosa-incident",
  "title": "美麗島事件",
  "description": "黨外人士於高雄舉辦集會遭鎮壓，美麗島事件成為臺灣民主化的重要轉折與反對運動象徵。",
  "date": { "start": "1979-12-10", "end": "1980-04-18", "period": "戰後時期", "periodId": "postwar" },
  "location": { "name": "高雄市", "coordinates": [22.63, 120.3], "adminDivisions": ["高雄市"] },
  "categories": ["歷史", "公民"],
  "keywords": ["美麗島事件", "黨外", "民主運動", "高雄"],
  "relatedEvents": ["martial-law", "lift-martial-law"],
  "examRelevance": { "importance": "high", "questionTypes": ["因果分析", "價值辨析"], "textbookReferences": ["社會科九年級上冊 臺灣近現代史"] }
}
```

- [ ] **Step 4: Run validation after reference normalization and Taiwan supplements**

Run: `npm run test:data`

Expected: PASS with a success message like `Validated 60+ events across 8 periods.`

- [ ] **Step 5: Run the production build after the full dataset update**

Run: `npm run build`

Expected: Angular build succeeds.

- [ ] **Step 6: Commit the Taiwan supplement batch**

```bash
git add webapp/public/assets/data/events.json
git commit -m "feat: expand Taiwan modern history events"
```

### Task 5: Final Integrity Pass and Release Readiness Check

**Files:**
- Modify: `webapp/public/assets/data/events.json`
- Modify: `webapp/public/assets/data/timeline.json`
- Modify: `webapp/src/app/services/quiz.service.ts`
- Modify: `webapp/package.json`
- Create: `webapp/scripts/validate-events.mjs`

- [ ] **Step 1: Verify related event ids introduced by the new batches**

Check these links and fix any missing targets before finalizing:

```text
age-of-discovery -> dutch-zeelandia, zheng-he-voyages
second-world-war -> un-founded, wwii-taiwan
formosa-incident -> martial-law, lift-martial-law
retrocession-taiwan -> second-world-war, feb28-incident
```

Use this rule while fixing: if a related event is not present in `events.json`, delete the link instead of inventing a placeholder event.

- [ ] **Step 2: Sort the event file by `date.start` ascending**

Reorder `webapp/public/assets/data/events.json` so earlier events appear first. This keeps maintenance manageable and makes sequence quiz behaviour easier to inspect in raw data reviews.

- [ ] **Step 3: Run the full verification sequence**

Run: `npm run test:data`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 4: Inspect the final diff before handoff**

Run: `git diff -- webapp/public/assets/data/timeline.json webapp/public/assets/data/events.json webapp/src/app/services/quiz.service.ts webapp/package.json webapp/scripts/validate-events.mjs`

Expected: Diff only contains timeline generalization, dataset expansion, quiz-service generalization, and validator additions.

- [ ] **Step 5: Commit the verification pass**

```bash
git add webapp/public/assets/data/timeline.json webapp/public/assets/data/events.json webapp/src/app/services/quiz.service.ts webapp/package.json webapp/scripts/validate-events.mjs
git commit -m "chore: validate expanded social studies dataset"
```

## Self-Review Notes

- Spec coverage: timeline generalization, dataset expansion order, textbook reference normalization, and validation safety net are all covered.
- Placeholder scan: the only conditional instructions are for deleting dangling `relatedEvents` entries rather than inventing missing events; this is explicit and bounded.
- Type consistency: `periodId`, `period`, `textbookReferences`, and `QuizService.generateQuestions(event, allEvents)` are used consistently across tasks.
