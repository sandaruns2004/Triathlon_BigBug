# 🏆 Tech-Triathlon 2026 — Team BigBug · Datathon Documentation

> **Challenge:** Datathon · **Deadline:** Day 15 · 9 October 2026  
> **Contact:** tech-triathlon@rootcode.io · [tech-triathlon.rootcode.ai](https://tech-triathlon.rootcode.ai/)

---

## 📋 Table of Contents

| Document | Description |
|---|---|
| [00_event_overview.md](./00_event_overview.md) | Full event details, timeline, speakers, eligibility |
| [01_challenge_overview.md](./01_challenge_overview.md) | High-level problem statement and context |
| **DESIGNATHON** | |
| [08_designathon_plan.md](./08_designathon_plan.md) | 🎨 Full Designathon plan — personas, screen flows, degradation, style guide |
| **HACKATHON** | |
| [09_hackathon_plan.md](./09_hackathon_plan.md) | 💻 Full Hackathon build plan — tech stack, architecture, engine, Docker |
| **DATATHON** | |
| [02_task1_delivery_prediction.md](./02_task1_delivery_prediction.md) | Task 1 — Delivery Service Time & Lateness Prediction |
| [03_task2a_volume_forecasting.md](./03_task2a_volume_forecasting.md) | Task 2A — Weekly Volume Forecasting |
| [04_task2b_peak_day_allocation.md](./04_task2b_peak_day_allocation.md) | Task 2B — Peak-Day Vehicle Allocation |
| [05_data_dictionary.md](./05_data_dictionary.md) | Full schema reference for all datasets |
| [06_submission_guide.md](./06_submission_guide.md) | Submission formats, validation, and deadlines |
| [07_action_plan.md](./07_action_plan.md) | Team action plan, priorities, and approach |

---

## 🗓️ Key Dates (Datathon)

| Milestone | Date & Time |
|---|---|
| Challenge Booklet Released | 25 Sep 2026, 12:00 AM |
| Designathon Submission Deadline | 29 Sep 2026 · Day 5 · **11:59 PM** |
| Hackathon Submission Deadline | 4 Oct 2026 · Day 10 · **11:59 PM** |
| **Datathon Submission Deadline** | **9 Oct 2026 · Day 15 · 11:59 PM** |

---

## 🗂️ Project Structure

```
Triathlon_BigBug/
├── Booklet/
│   ├── Challenge Booklet.pdf       ← Official challenge booklet
│   └── Challenge Booklet_2.pdf     ← Backup copy
├── data/
│   ├── General Data/               ← Reference tables (vehicles, outlets, etc.)
│   ├── Training Data/              ← Historical data for model training
│   ├── Test Data/                  ← Test inputs for submission
│   └── Submission Templates/       ← CSV templates to fill and submit
├── check_allocation.py             ← Task 2B feasibility validator script
└── docs/                           ← This documentation folder
```

---

## ⚡ Quick Start for Team

1. **Read** `01_challenge_overview.md` for the big picture
2. **Dive into tasks** via `02_task1`, `03_task2a`, `04_task2b`
3. **Understand all data** in `05_data_dictionary.md`
4. **Know submission rules** in `06_submission_guide.md`
5. **Follow the plan** in `07_action_plan.md`

---

## 🛠️ Tools & Dependencies

- **Python** (pandas, scikit-learn, numpy, xgboost/lightgbm recommended)
- **check_allocation.py** — run to validate Task 2B submission before submitting:
  ```bash
  python check_allocation.py path/to/submission_task2b.csv
  ```

---

*Documentation generated: 25 September 2026*
