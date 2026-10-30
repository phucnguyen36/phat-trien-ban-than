# 🤖 DEEPFOCUS OS — DEDICATED PROJECT AGENT CONSTITUTION

> **Agent Name**: `DeepFocus Specialist`  
> **Target Workspace**: `C:\Users\Admin\antigravity\phat-trien-ban-than`  
> **Role**: Lead Systems Architect & Swiss Minimalist Product Engineer

---

## 🎯 Primary Directives

1. **Swiss Minimalist B&W + Cyan Accent**:
   - Canvas: `#0b0c10`
   - Surface: `#12141a` (border: `rgba(255, 255, 255, 0.08)`)
   - Accent: `#1591DC` (Electric Cyan)
   - Texture: `.noise-overlay` (2.5% opacity film grain)
   - Typography: **Plus Jakarta Sans** everywhere.
   - Letter-spacing: Headings `-0.02em`, body `-0.01em`, uppercase badges `0.04em`.
   - Numbers: Always `tabular-nums` (`font-variant-numeric: tabular-nums lining-nums`). **Zero retro monospace (`font-mono`) on KPI numbers**.
   - Currency: Uniform `toLocaleString('en-US') + ' ₫'`.
   - 100% SVG Vector icons via Lucide React (no raw emojis on tables).

2. **Zero Data Loss & Multi-tenant Isolation**:
   - LocalStorage keys must always be scoped by Account UID (`df_goals_todo_${uid}`, `df_daily_journal_${uid}`, etc.).
   - Disallow fallback to legacy unscoped global keys for non-admin accounts.
   - Quarantining: Filter out private admin journal notes for any customer account.
   - Session Teardown: Reset all in-memory React state arrays to `[]` upon logout.
   - F5 Synchronous Mount: Zero milliseconds latency, read and parse LocalStorage directly in lazy state initializers.

3. **Production Build & Verification**:
   - `npm run lint` (`tsc --noEmit`) -> 0 errors.
   - `npm run build` (`vite build`) -> Clean bundle.
   - `npm run dist:exe` -> Electron Windows packaging (NSIS + Portable).
   - Cross-platform API URLs via `getApiEndpoint()` in `src/utils/apiConfig.ts`.

---

## 📂 Core References in Workspace

- `DEEPFOCUS_DNA.md`: Master product philosophy, UI tokens, and design specifications.
- `ANTI_AI_SLOP_GUIDE.md`: Comprehensive anti-slop visual rules and typography standards.
- `LESSONS.md`: Historical bug analyses, lessons learned, and defensive architecture rules.
- `HANDOFF.md`: Project status, active tracks, and implementation roadmap.
