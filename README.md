# Thrive — Patient Follow-Up Risk Predictor

An explainable, staff-usable clinical risk intelligence platform designed for healthcare providers to rank and prioritize patient follow-up drop-out risk. Powered by a deterministic 6-factor rule engine, every score is 100% traceable, rule-based, and free of opaque machine learning black boxes.

---

## Live Deployments

| Component | Host Platform | Production URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Dashboard** | Vercel | [thrive-ten-xi.vercel.app](https://thrive-ten-xi.vercel.app/) | Active |
| **Backend REST API** | Render | [thrive-6129.onrender.com](https://thrive-6129.onrender.com/) | Active |

---

## Key Features

- **Explainable Clinical Scoring Engine**: Calculates risk scores (0–100) using 6 weighted parameters with plain-English reason attribution.
- **Visual Analytics & Cards Dashboard**: Toggle between animated visual analytics dashboards, patient card grids, and high-density data tables.
- **Individual & Bulk PDF Exports**: Generate and download formatted PDF risk profiles for individual patients or multi-patient batch summaries.
- **Manual Intake & OCR Document Scanner**: Register patient data manually or automatically extract clinical metrics from scanned prescription images.
- **Nurse Outreach Call Queue**: Prioritized calling interface with interactive call scripts and logging of patient outcomes.
- **Automated Communication Hub**: Generate and track outreach emails sent to high-risk patients.

---

## Repository Structure

```
thrive/
├── client/                     # Frontend Application (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # Dashboard analytics, cards, modals, and showcase components
│   │   ├── pages/              # Landing, Dashboard, Bulk Upload, Nurse Calls, and Email pages
│   │   ├── utils/              # Client utilities including pdfGenerator.ts
│   │   └── types.ts            # Data contracts and TypeScript type definitions
│   └── vercel.json             # Vercel deployment routes & API rewrites
├── server/                     # Backend REST API (Node.js + Express + SQLite)
│   ├── src/
│   │   ├── config/             # Configurable clinical risk weights and parameters
│   │   ├── routes/             # Express API endpoints (patients, uploads, calls, emails)
│   │   ├── services/           # Deterministic scoring engine and SQLite data store
│   │   └── types/              # Server-side TypeScript interfaces
│   └── package.json            # Server configuration with Node >=22.5 runtime spec
├── DEPLOYMENT.md               # Step-by-step multi-cloud deployment guide
└── PROMPTS.md                  # Development timeline and prompt engineering log
```

---

## Clinical Scoring Engine Model

All factor weights and thresholds are configured in `server/src/config/riskWeights.ts`.

### Cold-Start Policy
Patients with **fewer than 2 recorded appointments** receive `score = null`, are assigned the **"Insufficient history"** tier, and are excluded from numeric ranking until sufficient history is gathered.

### 6-Factor Weighted Scoring Formula (Capped at 100)

| # | Factor | Max Points | Clinical Rule |
| :--- | :--- | :--- | :--- |
| 1 | **Missed Appointment Ratio** | 35 pts | `round((missed / total) * 35)` |
| 2 | **Days Overdue** | 20 pts | `round(clamp(days_since_last / frequency - 1, 0, 1.5) * 20)` |
| 3 | **Geographic Distance** | 15 pts | 15 pts if > 40 km, 8 pts if > 20 km, else 0 pts |
| 4 | **Treatment Fatigue** | 15 pts | 15 pts if elapsed/total > 0.7, 6 pts if > 0.4, else 0 pts |
| 5 | **Patient Age** | 10 pts | 10 pts if ≥ 65 yrs, 5 pts if ≤ 30 yrs, else 0 pts |
| 6 | **Visit Cadence** | 5 pts | 5 pts if target visit frequency ≤ 14 days, else 0 pts |

### Risk Tier Thresholds
- **High Risk**: Score ≥ 55
- **Medium Risk**: Score ≥ 30
- **Low Risk**: Score < 30
- **Insufficient History**: < 2 Appointments

---

## API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/patients` | Retrieve ranked patient list with risk scores and primary drivers |
| `POST` | `/api/patients` | Insert or update a patient and calculate score dynamically |
| `GET` | `/api/patients/:id` | Fetch single patient profile, factor breakdown, and suggested actions |
| `GET` | `/api/stats` | Retrieve aggregate counts by risk tier |
| `GET` | `/api/uploads` | Retrieve CSV upload history and batch analytics |
| `POST` | `/api/uploads` | Upload CSV dataset for bulk parsing and scoring |
| `GET` | `/api/calls` | Fetch nurse call queue with generated call scripts |
| `POST` | `/api/calls/log` | Record a nurse call outcome and notes |
| `GET` | `/api/emails/candidates` | Retrieve high-risk email outreach candidates |
| `POST` | `/api/emails/send-batch` | Trigger batch email outreach |
| `GET` | `/api/health` | Service liveness health check |

---

## Local Development Guide

### Prerequisites
- Node.js (v22.5.0 or higher recommended)
- npm (v10 or higher)

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*The REST API will start on `http://localhost:5000`.*

### 2. Start Frontend Application
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
*The Vite dashboard will start on `http://localhost:5173` and automatically proxy `/api` requests to the local backend.*

---

## Quality Assurance & Verification

Both packages include built-in TypeScript validation:

```bash
# Verify Client Type Safety
cd client && npm run typecheck

# Verify Server Type Safety
cd server && npm run typecheck
```

---

## Supporting Documentation

- [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md): Complete steps for deploying to Render and Vercel.
- [Prompt History (PROMPTS.md)](./PROMPTS.md): Documented development prompt engineering timeline.
