# Waypoint Flow — Team BigBug · Hackathon Submission
## Tech-Triathlon 2026

---

## Live Demo

- **URL:** [TO BE FILLED — Vercel deployment URL]
- **GitHub:** https://github.com/sandaruns2004/Triathlon_BigBug

---

## Demo Accounts

All accounts use password: **waypoint2026**

| Role | Email | Name | Access |
|---|---|---|---|
| Dispatcher | dispatcher@waypoint.lk | Nilantha Perera | /dispatcher — Desktop |
| Loader | loader@waypoint.lk | Chamara Bandara | /loader — Tablet |
| Driver | driver@waypoint.lk | Roshan Jayasinghe | /driver — Mobile 390px |
| Store Manager | store@waypoint.lk | Thilini W. | /store — Mobile or Desktop |

> **Mobile tip:** Chrome DevTools (F12) → Device Toolbar → 390 × 844 for Driver and Store Manager.

---

## Quick Start — Seed the Database

After deploy, call once to populate Firestore:

`
POST [YOUR-VERCEL-URL]/api/seed
`

---

## Allocation Engine — 9 Constraints

| # | Constraint |
|---|---|
| C1 | Depot match |
| C2 | Temperature — chilled/frozen → reefer vehicle only |
| C3 | Van-only parking outlets |
| C4 | Weight capacity |
| C5 | Volume capacity |
| C6 | Time budget: Fresh ≤ 270 min, Style/Tech ≤ 480 min |
| C7 | Fresh deliveries before 08:00 AM |
| C8 | Max 2 trips per vehicle per day |
| C9 | One brand + one district per trip |

---

## Key Docs

| File | Contents |
|---|---|
| docs/architecture.md | Mermaid system diagram |
| docs/data-model.md | Firestore schema |
| docs/ai-disclosure.md | AI tool disclosure |
| waypoint-flow/.env.example | All env variables |

---

*Team BigBug · Tech-Triathlon 2026*
