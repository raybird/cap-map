# Timeline 文字閱讀優化設計

**日期**：2026-05-22
**狀態**：已核准

## 問題描述

Timeline 上所有文字（朝代名稱、年份刻度、年份範圍、右上角指示器）字體過小、對比度不足，閱讀體驗差。

## 目標

在維持低調古典視覺風格的前提下，改善 timeline 所有文字元素的可讀性。

## 調整規格

| 元素 | CSS 類別 | 現況 | 調整後 |
|---|---|---|---|
| 年份刻度 | `.year-label` | `font-size: 0.52rem`，`color opacity 0.55` | `font-size: 0.7rem`，`color opacity 0.8` |
| 朝代名稱 | `.dynasty-label` | `font-size: 0.65rem`，`color opacity 0.85` | `font-size: 0.85rem`，`color opacity 0.9`，加 text-shadow |
| 朝代年份範圍 | `.dynasty-years` | `font-size: 0.55rem` | `font-size: 0.68rem` |
| 右上角指示器 | `.year-indicator` | `font-size: 0.6rem`，`color opacity 0.55` | `font-size: 0.75rem`，`color opacity 0.8` |
| Mobile 朝代名稱 | `.dynasty-label`（`@media max-width: 768px`） | `font-size: 0.55rem` | `font-size: 0.7rem` |

## text-shadow 規格

僅套用於 `.dynasty-label`：

```css
text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
```

目的：讓文字從彩色朝代帶底層浮出，提升對比，不破壞視覺設計。

## 受影響檔案

- `webapp/src/app/timeline/timeline.component.css`
