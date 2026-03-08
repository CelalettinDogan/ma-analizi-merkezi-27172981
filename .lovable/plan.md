

# Home Screen UI Enhancement — AI Prediction Preview on Match Cards

## Current State
The app already has all the structural elements described (header, hero badge, search CTA, league chips, today's matches, featured "Büyük Maç" card, bottom nav). The screenshot confirms the layout is working. The main missing feature from your description is the **AI prediction preview** on match cards (e.g., "BTTS: 64%, Over 2.5: 58%").

## What Needs to Change

### 1. New Hook: `src/hooks/useMatchAIPreview.ts`
- Query `cached_ai_predictions` table by match key (`homeTeam_vs_awayTeam_date`)
- Return top 2 predictions (type + confidence%) or null if no cached prediction exists
- Light caching with React Query (staleTime: 5min)

### 2. Featured Match Card Enhancement (`TodaysMatches.tsx`)
- Add `AIPreviewBadge` sub-component below the teams row
- Shows 2 prediction pills: e.g., `BTTS: 64%` and `Over 2.5: 58%`
- Styled as subtle `bg-primary/8 rounded-lg` row with small Sparkles icon
- Only renders when cached AI data exists for that match
- CTA text changes from "Analiz Et" to **"AI Analizi Gör"** when preview data exists

### 3. Match List Items — Micro AI Indicator
- For compact list matches: add a tiny `✨` dot or `AI` micro badge if cached prediction exists
- Indicates "we already have AI data for this match" — encourages tap

### 4. Files Changed
| File | Change |
|------|--------|
| `src/hooks/useMatchAIPreview.ts` | **New** — hook to fetch cached predictions |
| `src/components/TodaysMatches.tsx` | Add AI preview to featured card + micro indicator to list items |

### Technical Detail
```text
cached_ai_predictions table:
  match_key: "TeamA_vs_TeamB_2026-03-08"
  predictions: JSON array of { type, confidence, ... }

Hook returns:
  { topPredictions: [{ type: "BTTS", confidence: 64 }, { type: "Ü2.5", confidence: 58 }], hasData: boolean }
```

The featured card layout becomes:
```text
┌─────────────────────────────────┐
│ ⭐ Büyük Maç          H2H ●●○  │
│                                 │
│  [🏠] Milan    20:45    Inter [🏟]│
│              SA                 │
│                                 │
│  ┌─ AI Prediction ───────────┐  │
│  │ ✨ BTTS: 64%  •  Ü2.5: 58% │  │
│  └───────────────────────────┘  │
│                                 │
│     ✨ AI Analizi Gör  →        │
└─────────────────────────────────┘
```

