# Timeline 文字閱讀優化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 調整 timeline 元件 CSS，放大所有文字並增強對比度與陰影，提升閱讀體驗。

**Architecture:** 純 CSS 修改，僅變動 `timeline.component.css` 中五個選擇器的字體大小、顏色不透明度、text-shadow 屬性。不涉及任何 TypeScript 或 HTML 變更。

**Tech Stack:** Angular CSS（Scoped Component Styles）

---

### Task 1: 調整 `.year-indicator` 文字大小與對比

**Files:**
- Modify: `webapp/src/app/timeline/timeline.component.css`（約第 11–22 行）

- [ ] **Step 1: 找到 `.year-indicator` 區塊並確認現值**

開啟 `webapp/src/app/timeline/timeline.component.css`，確認以下兩行現況：
```css
font-size: 0.6rem;
color: rgba(44, 36, 27, 0.55);
```

- [ ] **Step 2: 修改 `.year-indicator` 的 font-size 與 color opacity**

將該區塊的兩個屬性改為：
```css
font-size: 0.75rem;
color: rgba(44, 36, 27, 0.8);
```

- [ ] **Step 3: 啟動 dev server 目視驗證**

```bash
cd webapp && npm start
```

在瀏覽器開啟 `http://localhost:4200`，捲動 timeline，確認右上角年份指示器字體明顯變大且顏色較深。

- [ ] **Step 4: Commit**

```bash
git add webapp/src/app/timeline/timeline.component.css
git commit -m "style: enlarge year-indicator font and increase contrast"
```

---

### Task 2: 調整 `.dynasty-label` 與 `.dynasty-years` 文字

**Files:**
- Modify: `webapp/src/app/timeline/timeline.component.css`（約第 153–174 行）

- [ ] **Step 1: 找到 `.dynasty-label` 區塊並確認現值**

確認以下屬性：
```css
font-size: 0.65rem;
color: rgba(44, 36, 27, 0.85);
```

- [ ] **Step 2: 修改 `.dynasty-label` 的字體、對比與陰影**

將屬性改為：
```css
font-size: 0.85rem;
color: rgba(44, 36, 27, 0.9);
text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
```

- [ ] **Step 3: 找到 `.dynasty-years` 區塊並確認現值**

確認：
```css
font-size: 0.55rem;
```

- [ ] **Step 4: 修改 `.dynasty-years` 的字體大小**

將屬性改為：
```css
font-size: 0.68rem;
```

- [ ] **Step 5: 目視驗證朝代帶文字**

在瀏覽器確認各朝代色帶（如「清領時期 1683~1895」）文字明顯可讀，且白色陰影讓文字從底色中浮出，不破壞視覺風格。

- [ ] **Step 6: Commit**

```bash
git add webapp/src/app/timeline/timeline.component.css
git commit -m "style: enlarge dynasty label/years font and add text-shadow for contrast"
```

---

### Task 3: 調整 `.year-label` 文字大小與對比

**Files:**
- Modify: `webapp/src/app/timeline/timeline.component.css`（約第 247–257 行）

- [ ] **Step 1: 找到 `.year-label` 區塊並確認現值**

確認：
```css
font-size: 0.52rem;
color: rgba(44, 36, 27, 0.55);
```

- [ ] **Step 2: 修改 `.year-label` 的字體大小與 color opacity**

將屬性改為：
```css
font-size: 0.7rem;
color: rgba(44, 36, 27, 0.8);
```

- [ ] **Step 3: 目視驗證年份刻度文字**

在瀏覽器確認 timeline 底部的年份刻度（如 1895、1945）清楚可讀，字體大小明顯提升。

- [ ] **Step 4: Commit**

```bash
git add webapp/src/app/timeline/timeline.component.css
git commit -m "style: enlarge year-label font and increase contrast"
```

---

### Task 4: 調整 Mobile 媒體查詢中的 `.dynasty-label`

**Files:**
- Modify: `webapp/src/app/timeline/timeline.component.css`（約第 259–264 行）

- [ ] **Step 1: 找到 `@media (max-width: 768px)` 區塊並確認現值**

確認：
```css
@media (max-width: 768px) {
  .dynasty-bands { height: 30px; }
  .event-dots { margin-top: 8px; }
  .dynasty-label { font-size: 0.55rem; }
  .dynasty-years { display: none; }
}
```

- [ ] **Step 2: 修改 mobile 版 `.dynasty-label` 字體**

將 `.dynasty-label` 的 font-size 改為：
```css
.dynasty-label { font-size: 0.7rem; }
```

- [ ] **Step 3: 目視驗證 Mobile 版面**

使用瀏覽器開發者工具切換至手機寬度（≤768px），確認朝代名稱文字在行動裝置上仍清晰可讀。

- [ ] **Step 4: Commit**

```bash
git add webapp/src/app/timeline/timeline.component.css
git commit -m "style: enlarge mobile dynasty-label font for readability"
```
