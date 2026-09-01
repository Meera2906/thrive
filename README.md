# Patient Follow-up Risk Predictor ("Thrive")

A transparent, staff-usable hospital dashboard for ranking patients by
follow-up drop-out risk. Every score is produced by a hand-authored, fully
explainable rule engine (no ML, no black box) — every point on the score is
traceable to a specific, plain-English reason.

```
thrive/
├── server/     Node.js + Express + TypeScript REST API
└── client/     React + TypeScript + Vite + Tailwind dashboard
```

This repo has already been verified to install, type-check, and build clean
(`tsc --noEmit` passes in both packages, `vite build` succeeds, and the API
was smoke-tested against all 18 seed patients).

---

## Opening this project in Antigravity

1. Open the `thrive/` folder as the workspace root in Antigravity.
2. Let the agent (or you, manually) run the setup commands below — Antigravity
   can run these directly in its integrated terminal.
3. Ask the agent to "start the API and the dashboard" and it can run the two
   `npm run dev` commands below in separate terminals/tasks.
4. The two packages are intentionally decoupled (separate `package.json`,
   separate `node_modules`) so Antigravity's dependency graph and any
   per-package agent tasks stay simple and isolated.

No API keys, external services, or database are required — the backend
serves an in-memory seed dataset of 18 synthetic patients.

---

## Manual setup

### 1. Backend (`server/`)

```bash
cd server
npm install
npm run dev        # starts on http://localhost:5000
```

Other scripts: `npm run build` (compile to `dist/`), `npm run typecheck`.

### 2. Frontend (`client/`)

In a second terminal:

```bash
cd client
npm install
npm run dev         # starts on http://localhost:5173
```

Vite is pre-configured to proxy `/api/*` requests to `http://localhost:5000`
(see `client/vite.config.ts`), so just open **http://localhost:5173** once
both servers are running.

Other scripts: `npm run build`, `npm run typecheck`.

---

## API

| Endpoint             | Description                                             |
|-----------------------|----------------------------------------------------------|
| `GET /api/patients`   | Full ranked patient list with risk scores & top reason   |
| `GET /api/patients/:id` | Single patient — full factor breakdown & actions        |
| `GET /api/stats`      | Counts of High / Medium / Low / Insufficient-history      |
| `GET /api/health`     | Liveness check                                            |

---

## The scoring model

All weights, caps, and thresholds live in one file:
`server/src/config/riskWeights.ts` — tune the model there without touching
`server/src/services/scoringEngine.ts`.

**Cold-start rule (checked first).** If a patient has fewer than 2 recorded
appointments, they get `score = null` (rendered as `—`), tier
`"Insufficient history"`, and are always sorted to the bottom of the list —
never scored as Low risk.

**Otherwise, six weighted factors are summed (capped at 100):**

| # | Factor              | Max pts | Rule |
|---|----------------------|---------|------|
| 1 | Missed-ratio         | 35      | `round((missed / total) * 35)` |
| 2 | Overdue-ness         | 20      | `round(clamp(days_since_last/frequency - 1, 0, 1.5) * 20)` |
| 3 | Distance             | 15      | 15 if > 40 km, 8 if > 20 km, else 0 |
| 4 | Treatment fatigue    | 15      | 15 if elapsed/total > 0.7, 6 if > 0.4, else 0 |
| 5 | Age band             | 10      | 10 if ≥ 65, 5 if ≤ 30, else 0 |
| 6 | Visit frequency      | 5       | 5 if expected cadence ≤ 14 days, else 0 |

**Tiers:** `≥ 55` High · `≥ 30` Medium · else Low.

**Suggested next actions** are looked up from the top 2 highest-scoring
factors for that patient (see `ACTIONS` in `riskWeights.ts`).

---

## Seed dataset

`server/src/services/seedData.ts` ships 18 synthetic patients, verified to
land as: **5 High**, **5 Medium**, **5 Low**, **3 Insufficient history** —
so every tier badge, the cold-start card, and the empty/sparse states all
have real examples to click through immediately.

---

## Frontend structure

```
client/src/
├── App.tsx                    Data fetching, search/filter/sort state
├── types.ts                   API response types
├── index.css                  Tailwind + tier color tokens
└── components/
    ├── Header.tsx              Branding bar
    ├── SummaryCards.tsx        Tier count tiles
    ├── PatientFilters.tsx      Search box, tier filter, sort dropdown
    ├── PatientList.tsx         Renders the ranked rows
    ├── PatientRow.tsx          Expandable row (Framer Motion animation)
    ├── FactorBar.tsx           Animated per-factor score bar
    └── PatientDetailModal.tsx  Optional deep-dive modal (not wired by
                                 default — available for a "view full
                                 profile" action if you want one)
```

---

## Notes for extending this

- Swap the in-memory `seedData.ts` for a real data source by keeping the
  `Patient` interface (`server/src/types/patient.ts`) as the contract —
  `scoringEngine.ts` doesn't care where patients come from.
- The engine is pure functions (`computeRisk(patient) → RiskResult`) with no
  side effects, so it's straightforward to unit test or port.
- `riskWeights.ts` is the only file clinical/ops staff should need to touch
  to retune thresholds.
