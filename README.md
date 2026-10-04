# 🏆 Tech-Triathlon 2026 — Team BigBug

> Organised by [RootCode](https://tech-triathlon.rootcode.ai/) · Contact: tech-triathlon@rootcode.io  
> **Company:** Waypoint Group · **Product:** Waypoint Flow

## 🌐 Live Demo

**→ https://waypointflow.vercel.app**

| Role | Email | Password | Viewport |
|---|---|---|---|
| Dispatcher | dispatcher@waypoint.lk | waypoint2026 | Desktop |
| Loader | loader@waypoint.lk | waypoint2026 | Desktop |
| Driver | driver@waypoint.lk | waypoint2026 | Chrome 390px |
| Store Manager | store@waypoint.lk | waypoint2026 | Mobile or Desktop |

> **Mobile tip:** Open Chrome DevTools → Device Toolbar → 390 × 844 for Driver and Store Manager screens.

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
│   └── Challenge Booklet_2.pdf
│
├── Docs-ui/                        ← Official Waypoint Flow design specifications
│   ├── Tech-Triathlon_2026_Designathon_Overview.md  ← Designathon brief summary
│   ├── items/                      ← Visual direction & audit reports
│   ├── mobile/                     ← Mobile screen specs (Driver + Store Manager)
│   │   ├── 00_Mobile_UI_System.md  ← Mobile design system
│   │   ├── 01_Driver_Today.md
│   │   ├── 02_Driver_Route_and_Stop.md
│   │   ├── 03_Driver_Proof_of_Delivery.md
│   │   ├── 04_Driver_Offline_and_Sync.md  ← Degradation screen
│   │   ├── 05_Store_Mobile_Home.md
│   │   ├── 06_Store_Mobile_Order_and_Tracking.md
│   │   └── 07_Authentication.md
│   └── pc/                         ← Desktop screen specs (Dispatcher + Loader + Store)
│       ├── 00_Desktop_UI_System.md ← Desktop design system
│       ├── 01_Dispatcher_Operations_Overview.md
│       ├── 02_Dispatcher_Plan_Builder.md
│       ├── 03_Dispatcher_Deferral_Impact.md  ← Primary degradation screen
│       ├── 04_Loader_Load_Board.md
│       ├── 05_Loader_Loading_Shortfall.md    ← Degradation screen
│       ├── 06_Store_Order_Composer.md
│       ├── 07_Store_Order_Tracking_and_Receipt.md
│       └── 08_Authentication.md
│
├── data/
│   ├── General Data/               ← Static reference tables
│   │   ├── calendar.csv            ← Date flags: payday, festival, monsoon
│   │   ├── district_travel.csv     ← Travel times & distances per district
│   │   ├── outlets.csv             ← 120 outlet master records
│   │   ├── road_conditions.csv     ← Road condition data
│   │   ├── service_allowance.csv   ← Planned service time by brand & dock type
│   │   ├── traffic_speed.csv       ← Hourly speed index per district
│   │   └── vehicles.csv            ← 60 vehicle master records (16 reefer)
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
    ├── 01_challenge_overview.md    ← Waypoint Group context + 3 task summaries
    ├── 02_task1_delivery_prediction.md  ← Task 1 deep dive
    ├── 03_task2a_volume_forecasting.md  ← Task 2A deep dive
    ├── 04_task2b_peak_day_allocation.md ← Task 2B deep dive + all constraints
    ├── 05_data_dictionary.md       ← Full schema for all files
    ├── 06_submission_guide.md      ← Formats, validation, checklists
    ├── 07_action_plan.md           ← Daily plan, priorities, approach
    ├── 08_designathon_plan.md      ← 🎨 Waypoint Flow design plan (full)
    └── 09_hackathon_plan.md        ← 💻 Waypoint Flow build plan (full)
```

---

## 🎨 Designathon (Day 5 · 29 Sep 2026 · 11:59 PM)

Design **Waypoint Flow** — one unified delivery management system for **Waypoint Group** across four roles.

| Deliverable | Detail |
|---|---|
| 4 User Personas | Dispatcher (desktop) · Loader (tablet) · Driver (mobile) · Store Manager (mobile/desktop) |
| Screen flows + rationale | 15 screens total · ≥1 paragraph per screen |
| Degradation screens | Capacity Deferral · Loading Shortfall · Offline & Sync |
| Hi-fi prototype | Figma interactive prototype |
| Design system | Color tokens · typography · status language · icon system |
| Demo video | 3–5 min YouTube (unlisted) |
| AI disclosure | Required |
| Submission | `BigBug_Designathon.zip` + Figma URL + YouTube URL |

**Visual direction:** "Calm Operational Clarity" · Deep green `#146B45` · Inter font · Lucide icons

**Full plan:** [`docs/08_designathon_plan.md`](docs/08_designathon_plan.md)

---

## 💻 Hackathon (Day 10 · 4 Oct 2026 · 11:59 PM)

Build **Waypoint Flow** from the Designathon spec.

| Aspect | Detail |
|---|---|
| Product | **Waypoint Flow** (Waypoint Group delivery management system) |
| Stack | Next.js 14 · Node.js · PostgreSQL 15 · Socket.IO · Prisma · Tailwind CSS · Lucide |
| Repo | `BigBug_WaypointDelivery` (GitHub monorepo) |
| Docker | `docker compose up` starts full stack + seeds data |
| Accounts | 4 seeded accounts (dispatcher / loader / driver / store manager) |
| Key feature | Allocation engine respecting all operating constraints |
| Demo video | 5–8 min YouTube (unlisted) — all 4 roles + architecture |

**Full plan:** [`docs/09_hackathon_plan.md`](docs/09_hackathon_plan.md)

---

## 📊 The Three Datathon Tasks

| Task | What to Predict | Submission File |
|---|---|---|
| **Task 1** | Service time (min) + late probability for 5,015 deliveries | `submission_task1.csv` |
| **Task 2A** | Weekly total & chilled volume (m³) for 60 depot-brand-week combos | `submission_task2a.csv` |
| **Task 2B** | Serve or defer each of 86 orders; assign vehicle + trip if served | `submission_task2b.csv` |

---

## 🚀 Quick Start (Datathon)

### Set up environment
```bash
pip install pandas numpy lightgbm xgboost scikit-learn matplotlib seaborn
```

### Explore the data
```python
import pandas as pd

deliveries = pd.read_csv('data/Training Data/deliveries_train.csv')
legs       = pd.read_csv('data/Training Data/route_legs_train.csv')
vehicles   = pd.read_csv('data/General Data/vehicles.csv')
outlets    = pd.read_csv('data/General Data/outlets.csv')
calendar   = pd.read_csv('data/General Data/calendar.csv')
```

### Validate Task 2B before submitting
```bash
python check_allocation.py "data/Submission Templates/submission_task2b.csv"
# Must output: FEASIBILITY: PASSED - every rule satisfied.
```

---

## 🔑 Waypoint Group — Key Operating Constraints

| Brand | Outlets | Delivery | Temperature |
|---|---|---|---|
| Waypoint Fresh | 80 | Before 8 AM daily | Refrigerated (reefer) only |
| Waypoint Style | 25 | Weekly, daytime | Ambient |
| Waypoint Tech | 15 | As-needed, daytime | Ambient |

| Constraint | Detail |
|---|---|
| Task 2B feasibility | Must pass `check_allocation.py` — failing = **zero score** |
| One brand per trip | A vehicle trip carries only Fresh, Style, OR Tech |
| One district per trip | A vehicle trip services only one district |
| Chilled → reefer only | Chilled orders need a reefer vehicle |
| van_only outlets | Narrow street outlets accept vans only |
| Time budget — Fresh | All Fresh trips per vehicle ≤ **270 min** (pre-dawn) |
| Time budget — Style/Tech | All non-Fresh trips per vehicle ≤ **480 min** (daytime) |
| Max 2 trips/vehicle/day | Each vehicle runs at most trip 1 and trip 2 |
| Dispatcher must record deferral reason | Never a silent decision |
| Driver offline support | Field connectivity is unreliable; app must work fully offline |

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

## 📚 Full Documentation

→ [`docs/README.md`](docs/README.md) — start here  
→ [`docs/08_designathon_plan.md`](docs/08_designathon_plan.md) — Designathon full plan  
→ [`docs/09_hackathon_plan.md`](docs/09_hackathon_plan.md) — Hackathon full plan  
→ [`Docs-ui/Tech-Triathlon_2026_Designathon_Overview.md`](Docs-ui/Tech-Triathlon_2026_Designathon_Overview.md) — Official brief

---

*Last updated: 27 September 2026*
