# 07 · Team Action Plan — Tech-Triathlon 2026 Datathon

## ⏰ Timeline: 15 Days (25 Sep – 9 Oct 2026)

| Day | Date | Milestone |
|---|---|---|
| Day 1 | 25 Sep (Thu) | Booklet release — understand all tasks ← **TODAY** |
| Day 2 | 26 Sep (Fri) | Data exploration complete; feature ideas documented |
| Day 3 | 27 Sep (Sat) | Task 2B baseline solution (feasibility PASSED) |
| Day 4 | 28 Sep (Sun) | Task 1 baseline model trained |
| Day 5 | 29 Sep (Mon) | **Designathon deadline · 11:59 PM** (not our task) |
| Day 6 | 30 Sep (Tue) | Task 2A baseline model trained |
| Day 7 | 1 Oct (Wed) | All 3 tasks have valid baseline submissions |
| Day 8 | 2 Oct (Thu) | Task 1 refinement (feature engineering, tuning) |
| Day 9 | 3 Oct (Fri) | Task 2A refinement + Task 2B optimization |
| Day 10 | 4 Oct (Sat) | **Hackathon deadline · 11:59 PM** (not our task) |
| Day 11 | 5 Oct (Sun) | Final model tuning — all tasks |
| Day 12 | 6 Oct (Mon) | Final validation run on all submissions |
| Day 13 | 7 Oct (Tue) | Buffer day / edge case fixes |
| Day 14 | 8 Oct (Wed) | Final review, format check, backup |
| Day 15 | 9 Oct (Thu) | **DATATHON SUBMISSION DEADLINE · 11:59 PM** |

---

## 🔴 Priority Order

> Complete in this order — Task 2B must be feasibility-valid above all else.

1. **[CRITICAL] Task 2B feasibility** — A failing submission scores 0
2. **[HIGH] Task 1 baseline** — Largest dataset, most signals available
3. **[HIGH] Task 2A baseline** — Straightforward time-series forecasting
4. **[MEDIUM] Task 2B optimization** — Maximize orders served after feasibility
5. **[MEDIUM] Task 1 refinement** — Better features = better score
6. **[LOW] Task 2A refinement** — Diminishing returns after good baseline

---

## 📋 Task Breakdown & Responsibilities

### Task 2B — Peak-Day Allocation (START FIRST)

**Approach:**
1. Parse available vehicles (28 vehicles for S1)
2. Identify chilled orders → must use VEH003, VEH006, VEH007, or VEH036
3. Identify van_only orders → must use VEH036, VEH037, or VEH038
4. Group orders by (brand, district)
5. Solve as bin-packing / greedy assignment:
   - Sort orders by priority (deferred_yesterday first, then days_since_last_served)
   - Assign to vehicles checking capacity + time budget per trip
6. Defer any order that cannot fit in available vehicles
7. Validate with `check_allocation.py`

**Tools needed:** Python + pandas (no ML required, this is operations research)

---

### Task 1 — Delivery Prediction

**Phase 1: Data Prep**
```
deliveries_train.csv + route_legs_train.csv → merged_training.csv
```
- Compute `actual_service_min = leave_outlet_time - arrival_time`
- Compute `is_late = arrival_time > window_close_time`
- Join `service_allowance.csv` for dock_type baseline
- Join `calendar.csv` for payday/festival/monsoon flags
- Join `traffic_speed.csv` for congestion at delivery hour

**Phase 2: Features**
Key features to build:
- `brand_encoded` (Fresh=0, Style=1, Tech=2)
- `dock_type_encoded` (rear_dock=0, street=1, mall_bay=2)
- `service_allowance_baseline` (from service_allowance.csv)
- `order_size_scaled` (weight + volume normalized)
- `seq_in_route` (position in delivery run)
- `planned_buffer_min = window_close_time - planned_arrival_time`
- `hour_of_arrival` (integer hour)
- `congestion_index` (from traffic_speed.csv for district + hour + monsoon)
- `is_monsoon`, `is_payday`, `is_holiday`, `is_weekend`
- `vehicle_type_enc` (van=0, truck=1)
- `district_enc` (label encode)

**Phase 3: Models**
- `pred_service_min` → LightGBM Regressor
- `pred_late_prob` → LightGBM Classifier (predict_proba)
- Temporal cross-validation (train on 2024, validate on early 2026)

---

### Task 2A — Volume Forecasting

**Phase 1: Build Weekly Series**
- Aggregate `deliveries_train.csv` by (depot, brand, iso_year, iso_week)
- Total volume and chilled volume per group
- Join calendar week-level features

**Phase 2: Features per week**
- Number of operating days in week
- Payday count
- Max festival_ramp
- Monsoon days count
- Month-of-year (seasonality)
- Cyclical encoding of week: `sin(2π*week/52)`, `cos(2π*week/52)`
- Lag features: volume 4 weeks ago, 52 weeks ago (same week last year)

**Phase 3: Models** (6 series = 2 depots × 3 brands)
- Option A: LightGBM on all 6 combined (brand + depot as features)
- Option B: 6 separate Prophet/ARIMA models
- Recommend: LightGBM if data is sufficient, Prophet for transparency

---

## 🧰 Tools & Libraries

| Task | Recommended Libraries |
|---|---|
| Data manipulation | pandas, numpy |
| Task 1 & 2A ML | lightgbm, xgboost, scikit-learn |
| Task 2A forecasting | prophet (optional), statsmodels |
| Task 2B optimization | Python (greedy/backtrack), scipy.optimize |
| Validation | check_allocation.py (provided) |
| Visualization | matplotlib, seaborn |

### Install
```bash
pip install pandas numpy lightgbm xgboost scikit-learn matplotlib seaborn prophet
```

---

## 🗄️ Recommended File Structure for Code

```
Triathlon_BigBug/
├── notebooks/
│   ├── 01_eda_task1.ipynb          ← Exploratory data analysis
│   ├── 02_eda_task2a.ipynb
│   ├── 03_task1_model.ipynb        ← Task 1 model training
│   ├── 04_task2a_model.ipynb       ← Task 2A forecasting
│   └── 05_task2b_allocation.ipynb  ← Task 2B solver
├── src/
│   ├── features.py                 ← Feature engineering functions
│   ├── task1_model.py              ← Task 1 train/predict
│   ├── task2a_model.py             ← Task 2A train/predict
│   └── task2b_solver.py            ← Task 2B allocation solver
├── submissions/
│   ├── submission_task1_v1.csv
│   ├── submission_task2a_v1.csv
│   └── submission_task2b_v1.csv
└── docs/                           ← This folder
```

---

## 🔍 Key Things to Investigate in EDA

### Task 1
- [ ] Distribution of actual service times by brand, dock_type, district
- [ ] Lateness rate by time of day, district, monsoon
- [ ] How much do orders deviate from the service_allowance baseline?
- [ ] What % of deliveries are late overall?
- [ ] Correlation between seq_in_route and lateness

### Task 2A
- [ ] Weekly volume trends by brand and depot (Jan 2024 → Aug 2026)
- [ ] Payday vs non-payday volume difference
- [ ] Festival impact on volumes (1 week before vs normal)
- [ ] Monsoon impact on volumes
- [ ] Year-over-year growth pattern

### Task 2B
- [ ] Total volume of chilled orders in S1
- [ ] Total volume for each (district, brand) group
- [ ] Which orders are `deferred_yesterday` = 1 (priority serve)
- [ ] Which orders are `van_only` (scarce resource)
- [ ] Volume feasibility: can all orders physically fit in available vehicles?

---

## ⚠️ Risk Items

| Risk | Mitigation |
|---|---|
| Task 2B fails feasibility check | Run `check_allocation.py` after every change |
| van_only outlets and limited vans | VEH036/037/038 only — plan carefully |
| Fresh chilled orders and limited reefer vans | VEH003, VEH006, VEH007, VEH036 only |
| Time budget exceeded for fresh trips | Max 270 min total — restrict stops per trip |
| Late submission | Prepare final files by Day 13 latest |
| `pred_chilled_volume_m3 > pred_total_volume_m3` | Always cap chilled ≤ total in postprocessing |
| Style/Tech chilled volume (should be 0) | Hard-code 0 for ambient-only brands |

---

## 📬 Communication

- **Kick-off briefing:** Team leader to share notes from the 24 Sep kick-off
- **Questions to organizers:** tech-triathlon@rootcode.io
- **Internal sync:** Daily (brief check-in on progress and blockers)
