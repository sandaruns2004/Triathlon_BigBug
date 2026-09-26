# 🏆 Tech-Triathlon 2026 — Team BigBug

> **Datathon** · 9 October 2026 · 11:59 PM  
> Organised by [RootCode](https://tech-triathlon.rootcode.ai/) · Contact: tech-triathlon@rootcode.io

---

## ⏰ Deadlines

| Challenge | Day | Date | Time |
|---|---|---|---|
| 🎨 Designathon | Day 5 | 29 September 2026 | **11:59 PM** |
| 💻 Hackathon | Day 10 | 4 October 2026 | **11:59 PM** |
| 📊 **Datathon** | **Day 15** | **9 October 2026** | **11:59 PM** |

---

## 📂 Project Structure

```
Triathlon_BigBug/
│
├── README.md                       ← You are here
│
├── Booklet/
│   ├── Challenge Booklet.pdf       ← Official challenge booklet (read this first)
│   └── Challenge Booklet_2.pdf     ← Backup copy
│
├── data/
│   ├── General Data/               ← Static reference tables
│   │   ├── calendar.csv            ← Date flags: payday, festival, monsoon
│   │   ├── district_travel.csv     ← Travel times & distances per district
│   │   ├── outlets.csv             ← 120 outlet master records
│   │   ├── road_conditions.csv     ← Road condition data
│   │   ├── service_allowance.csv   ← Planned service time by brand & dock type
│   │   ├── traffic_speed.csv       ← Hourly speed index per district
│   │   └── vehicles.csv            ← 60 vehicle master records
│   │
│   ├── Training Data/              ← Historical data for ML model training
│   │   ├── deliveries_train.csv    ← ~92K delivery records (13 MB)
│   │   └── route_legs_train.csv    ← ~92K route legs with actual timings (12 MB)
│   │
│   ├── Test Data/                  ← Inputs to generate predictions for
│   │   ├── task1_test_inputs.csv   ← 5,015 deliveries to predict
│   │   ├── route_legs_test.csv     ← Route legs for test deliveries
│   │   ├── task2a_test_inputs.csv  ← 60 weekly volume rows to forecast
│   │   ├── task2b_peak_day_fleet.csv      ← Vehicle availability for peak day
│   │   └── task2b_peak_day_scenarios.csv  ← 86 orders for peak day allocation
│   │
│   └── Submission Templates/       ← Fill these and submit
│       ├── submission_task1.csv    ← 5,015 rows — pred_service_min, pred_late_prob
│       ├── submission_task2a.csv   ← 60 rows — volume forecasts
│       └── submission_task2b.csv   ← 86 rows — allocation decisions
│
├── check_allocation.py             ← Task 2B feasibility validator (run before submitting!)
│
└── docs/                           ← Full documentation
    ├── README.md                   ← Docs navigation hub
    ├── 00_event_overview.md        ← Event info, kick-off, eligibility
    ├── 01_challenge_overview.md    ← Business context, fleet, outlets
    ├── 02_task1_delivery_prediction.md  ← Task 1 deep dive
    ├── 03_task2a_volume_forecasting.md  ← Task 2A deep dive
    ├── 04_task2b_peak_day_allocation.md ← Task 2B deep dive + all constraints
    ├── 05_data_dictionary.md       ← Full schema for all files
    ├── 06_submission_guide.md      ← Formats, validation, checklists
    └── 07_action_plan.md           ← Daily plan, priorities, approach
```

---

## 🚀 Quick Start

### 1. Read the docs
Start with [`docs/01_challenge_overview.md`](docs/01_challenge_overview.md) then the individual task files.

### 2. Set up environment
```bash
pip install pandas numpy lightgbm xgboost scikit-learn matplotlib seaborn
```

### 3. Explore the data
```python
import pandas as pd

# Training data
deliveries = pd.read_csv('data/Training Data/deliveries_train.csv')
legs       = pd.read_csv('data/Training Data/route_legs_train.csv')

# Reference tables
vehicles   = pd.read_csv('data/General Data/vehicles.csv')
outlets    = pd.read_csv('data/General Data/outlets.csv')
calendar   = pd.read_csv('data/General Data/calendar.csv')
```

### 4. Validate Task 2B before submitting
```bash
python check_allocation.py "data/Submission Templates/submission_task2b.csv"
# Must output: FEASIBILITY: PASSED - every rule satisfied.
```

---

## 📊 The Three Datathon Tasks

| Task | What to Predict | Submission File |
|---|---|---|
| **Task 1** | Service time (min) + late probability for 5,015 deliveries | `submission_task1.csv` |
| **Task 2A** | Weekly total & chilled volume (m³) for 60 depot-brand-week combos | `submission_task2a.csv` |
| **Task 2B** | Serve or defer each of 86 orders; assign vehicle + trip if served | `submission_task2b.csv` |

---

## 🎨 Designathon (Day 5 · 29 Sep 2026 · 11:59 PM)

Design one unified system for the **Waypoint** delivery workflow across four roles.

| Deliverable | Detail |
|---|---|
| 4 User Personas | Dispatcher, Loader, Driver, Store Manager |
| Screen flows + rationale | All 4 roles with ≥1 paragraph per screen |
| Degradation screens | ≥1 failure scenario fully designed |
| Hi-fi prototype | Figma interactive prototype |
| Demo video | 3–5 min YouTube (unlisted) |
| AI disclosure | Required |
| Submission | `BigBug_Designathon.zip` + Figma URL + YouTube URL |

**Full plan:** [`docs/08_designathon_plan.md`](docs/08_designathon_plan.md)

---

## 💻 Hackathon (Day 10 · 4 Oct 2026 · 11:59 PM)

Build the Waypoint system from the Designathon spec.

| Aspect | Detail |
|---|---|
| Stack | Next.js 14 · Node.js · PostgreSQL 15 · Socket.IO · Prisma · Tailwind CSS |
| Repo | `BigBug_WaypointDelivery` (GitHub monorepo) |
| Docker | `docker compose up` starts full stack + seeds data |
| Accounts | 4 seeded accounts (dispatcher / loader / driver / store manager) |
| Key feature | Allocation engine enforcing all 9 operating constraints |
| Demo video | 5–8 min YouTube (unlisted) — all 4 roles + architecture |

**Full plan:** [`docs/09_hackathon_plan.md`](docs/09_hackathon_plan.md)

---

## 🔑 Critical Rules

| Rule | Detail |
|---|---|
| Task 2B feasibility | Must pass `check_allocation.py` — failing = **zero score** |
| One brand per trip | A vehicle trip carries only Fresh, Style, OR Tech |
| One district per trip | A vehicle trip services only one district |
| Chilled → reefer only | Chilled orders need a reefer vehicle |
| van_only outlets | Narrow street outlets accept vans only |
| Time budget — Fresh | All Fresh trips per vehicle ≤ **270 min** (pre-dawn) |
| Time budget — Style/Tech | All non-Fresh trips per vehicle ≤ **480 min** (daytime) |
| Max 2 trips/vehicle/day | Each vehicle runs at most trip 1 and trip 2 |

---

## 📅 Event Info

| Item | Detail |
|---|---|
| Kick-off | 24 Sep 2026, 4:00 PM · Google Meet (team leaders only) |
| Booklet released | 25 Sep 2026, 12:00 AM |
| Organiser | RootCode |
| Contact | tech-triathlon@rootcode.io |
| Eligibility | Currently enrolled undergraduates only |

---

## 📚 Documentation

Full details in the [`docs/`](docs/) folder → start with [`docs/README.md`](docs/README.md).

---

*Last updated: 25 September 2026*
