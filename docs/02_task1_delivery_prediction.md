# 02 · Task 1 — Delivery Service Time & Late Probability Prediction

## 🎯 Objective

For each delivery record in the **test set**, predict two values:

| Output Column | Type | Description |
|---|---|---|
| `pred_service_min` | Float | Actual service time at the outlet in minutes |
| `pred_late_prob` | Float (0–1) | Probability that the delivery arrives after the window close time |

---

## 📁 Files Involved

| File | Path | Role |
|---|---|---|
| `deliveries_train.csv` | `data/Training Data/` | Training data — historical deliveries with actuals |
| `route_legs_train.csv` | `data/Training Data/` | Route legs with actual travel & service timings |
| `task1_test_inputs.csv` | `data/Test Data/` | 5,015 deliveries to predict |
| `route_legs_test.csv` | `data/Test Data/` | Route legs for test deliveries (no actuals) |
| `submission_task1.csv` | `data/Submission Templates/` | Template to fill — `delivery_id`, `pred_service_min`, `pred_late_prob` |

---

## 📐 Training Data Schema

### `deliveries_train.csv` — columns
| Column | Description |
|---|---|
| `delivery_id` | Unique delivery identifier (e.g., ORD0000001) |
| `order_date` | Date order was placed |
| `dispatch_date` | Date dispatched |
| `dispatch_status` | e.g., `attempted` |
| `outlet_id` | Outlet receiving the delivery |
| `brand` | Fresh / Style / Tech |
| `district` | District of outlet |
| `depot` | Peliyagoda or Kandy |
| `temp_requirement` | ambient or chilled |
| `order_units` | Number of units |
| `order_weight_kg` | Weight in kg |
| `order_volume_m3` | Volume in m³ |
| `route_id` | Which route this delivery is on |
| `seq_in_route` | Stop sequence number in the route |
| `vehicle_id` | Vehicle used |
| `vehicle_type` | truck or van |
| `vehicle_temp` | reefer or ambient |
| `planned_arrival_time` | Scheduled arrival (HH:MM) |
| `window_open_time` | Outlet's opening time |
| `window_close_time` | Outlet's closing time |

### `route_legs_train.csv` — columns (key actuals)
| Column | Description |
|---|---|
| `leg_id` | Unique leg identifier |
| `date` | Date of delivery |
| `route_id` | Route this leg belongs to |
| `depot` | Depot |
| `vehicle_id` | Vehicle |
| `brand` | Brand |
| `district` | District |
| `seq` | Leg sequence in route |
| `from_point` | Starting point (DEPOT or outlet_id) |
| `to_outlet` | Destination outlet |
| `distance_km` | Leg distance |
| `planned_depart_time` | Planned departure time |
| `planned_travel_duration_min` | Planned travel time |
| `planned_arrival_time` | Planned arrival |
| `actual_depart_time` | ✅ Actual departure |
| `actual_travel_duration_min` | ✅ Actual travel time |
| `arrival_time` | ✅ Actual arrival |
| `leave_outlet_time` | ✅ Actual time leaving outlet (service done) |
| `monsoon` | 1 = monsoon conditions, 0 = normal |
| `dow` | Day of week (0=Mon, 6=Sun) |

> **Service time** = `leave_outlet_time` − `arrival_time`  
> **Late** = `arrival_time` > `window_close_time`

---

## 🔑 Key Factors to Engineer

### For `pred_service_min`
- **Brand** — Fresh is much faster than Style/Tech (service_allowance.csv baseline)
- **dock_type** — rear_dock < street < mall_bay (see service_allowance.csv)
- **order_units / order_weight_kg / order_volume_m3** — larger orders take longer
- **seq_in_route** — later stops may accumulate delays
- **vehicle_type** — van vs truck unloading differences
- **day_of_week** — weekend patterns differ
- **monsoon** — weather affects service

### For `pred_late_prob`
- **planned_arrival_time vs window_open/close** — buffer matters
- **seq_in_route** — later stops more likely to be late
- **monsoon** — traffic impact (see traffic_speed.csv)
- **district** — urban (Colombo, Kandy) vs rural congestion
- **hour of day** — peak traffic hours (7–9 AM worst in Colombo)
- **actual vs planned travel gap** — if route_legs shows variance

---

## 🧮 Service Allowance Baseline (from `service_allowance.csv`)

| Brand | Dock Type | Service Allowance (min) |
|---|---|---|
| Fresh | rear_dock | 15 |
| Fresh | street | 16 |
| Fresh | mall_bay | 18 |
| Style | rear_dock | 38 |
| Style | street | 46 |
| Style | mall_bay | 59 |
| Tech | rear_dock | 43 |
| Tech | street | 55 |
| Tech | mall_bay | 55 |

> Use these as baseline features; actual service times will deviate based on order size, conditions, etc.

---

## 📊 Data Scale

| Dataset | Records | Size |
|---|---|---|
| Training deliveries | ~92,308 | 13 MB |
| Training route legs | ~91,895 | 12 MB |
| Test deliveries to predict | **5,015** | 724 KB |
| Test route legs | **5,015** | 554 KB |

---

## 🛠️ Recommended Approach

### Step 1: Merge Training Data
```python
import pandas as pd

deliveries = pd.read_csv('data/Training Data/deliveries_train.csv')
legs = pd.read_csv('data/Training Data/route_legs_train.csv')

# Compute service_min from route legs
legs['service_min'] = (
    pd.to_datetime(legs['leave_outlet_time'], format='%H:%M') -
    pd.to_datetime(legs['arrival_time'], format='%H:%M')
).dt.total_seconds() / 60

# Compute is_late
legs['is_late'] = (
    pd.to_datetime(legs['arrival_time'], format='%H:%M') >
    pd.to_datetime(legs['window_close_time'], format='%H:%M')  # need to join from deliveries
).astype(int)
```

### Step 2: Feature Engineering
- Join service_allowance.csv for dock_type baseline
- Join calendar.csv for payday, festival, holiday flags
- Join traffic_speed.csv for congestion index at dispatch hour
- Calculate time buffers: `window_close - planned_arrival`

### Step 3: Model Training
- **pred_service_min** → Gradient Boosted Regressor (LightGBM / XGBoost)
- **pred_late_prob** → Gradient Boosted Classifier (with `predict_proba`)
- Cross-validate on date-based splits (temporal CV)

### Step 4: Fill Submission Template
```python
test = pd.read_csv('data/Test Data/task1_test_inputs.csv')
# ... predict ...
submission = pd.DataFrame({
    'delivery_id': test['delivery_id'],
    'pred_service_min': predictions_service,
    'pred_late_prob': predictions_late_prob
})
submission.to_csv('data/Submission Templates/submission_task1.csv', index=False)
```

---

## ✅ Submission Checklist

- [ ] 5,015 rows (one per delivery_id in test inputs)
- [ ] Columns: `delivery_id`, `pred_service_min`, `pred_late_prob`
- [ ] `pred_service_min` > 0 (no negatives)
- [ ] `pred_late_prob` in range [0, 1]
- [ ] No blank/null values
- [ ] Matches template format exactly
