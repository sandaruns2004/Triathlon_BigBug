# 05 · Data Dictionary — All Files Reference

## Overview

All data files are located under `data/` in the project root.

```
data/
├── General Data/          ← Static reference tables
├── Training Data/         ← Historical records for ML training
├── Test Data/             ← Inputs to generate predictions for
└── Submission Templates/  ← CSV skeletons to fill in
```

---

## 📁 General Data

### `vehicles.csv` — Fleet Master
**60 records** (VEH001–VEH060)

| Column | Type | Description |
|---|---|---|
| `vehicle_id` | string | Unique vehicle ID |
| `type` | enum | `truck` or `van` |
| `temp` | enum | `reefer` (refrigerated) or `ambient` |
| `weight_cap_kg` | float | Maximum weight capacity in kg |
| `volume_cap_m3` | float | Maximum volume capacity in m³ |
| `fuel_type` | string | All `diesel` in current fleet |
| `km_per_l` | float | Fuel efficiency |
| `weekly_fuel_quota_l` | int | Fuel allocation per week (litres) |
| `depot` | enum | `Peliyagoda` or `Kandy` |

**Summary by depot:**
| Depot | Trucks | Vans | Total | Reefer | Ambient |
|---|---|---|---|---|---|
| Peliyagoda | 34 | 4 | 38 | 9 | 29 |
| Kandy | 18 | 4 | 22 | 7 | 15 |

---

### `outlets.csv` — Outlet Master
**120 records** (OUT001–OUT120)

| Column | Type | Description |
|---|---|---|
| `outlet_id` | string | Unique outlet ID |
| `brand` | enum | `Fresh`, `Style`, or `Tech` |
| `district` | string | District name |
| `depot` | string | Serving depot |
| `dock_type` | enum | `rear_dock`, `street`, `mall_bay` |
| `parking_constraint` | enum | `normal`, `van_only`, `mall_dock` |
| `mall_window` | string | Mall time slot (e.g., `09:00-11:00`), blank if not mall |
| `window_open_time` | time (HH:MM) | Earliest acceptable delivery time |
| `window_close_time` | time (HH:MM) | Latest acceptable delivery time |

**Outlet count by brand:**
| Brand | Count |
|---|---|
| Fresh | 75 |
| Style | 27 |
| Tech | 18 |

**Van-only outlets (require van vehicle):**
- Colombo: OUT001, OUT002, OUT003 (Fresh)
- Kandy: OUT076–OUT083, OUT088, OUT093 (Fresh/Style/Tech)

---

### `district_travel.csv` — Travel Time Parameters
**12 records** (one per district)

| Column | Type | Description |
|---|---|---|
| `district` | string | District name |
| `depot` | string | Serving depot |
| `road_class` | enum | `urban`, `suburban`, `highway`, `hill` |
| `free_flow_kmh` | float | Free-flow speed in km/h |
| `depot_to_district_km` | float | Depot to district centroid distance |
| `depot_to_district_freeflow_min` | float | Travel time at free-flow speed |
| `inter_stop_km` | float | Average distance between stops in district |
| `inter_stop_freeflow_min` | float | Travel time between stops at free-flow |

**Key values:**
| District | Depot→District (min) | Inter-Stop (min) | Road Type |
|---|---|---|---|
| Colombo | 24 | 8 | urban |
| Gampaha | 37 | 9 | suburban |
| Kalutara | 64 | 12 | suburban |
| Galle | 103 | 9 | highway |
| Matara | 137 | 10 | highway |
| Kurunegala | 127 | 19 | suburban |
| Puttalam | 173 | 24 | suburban |
| Kandy | 16 | 6 | urban |
| Matale | 35 | 11 | suburban |
| Nuwara Eliya | 111 | 20 | hill |
| Badulla | 186 | 23 | hill |
| Kegalle | 53 | 13 | suburban |

---

### `service_allowance.csv` — Planned Service Times
**9 records** (brand × dock_type)

| Column | Type | Description |
|---|---|---|
| `brand` | enum | Fresh / Style / Tech |
| `dock_type` | enum | rear_dock / street / mall_bay |
| `service_allowance_min` | int | Planned minutes at outlet |

| Brand | rear_dock | street | mall_bay |
|---|---|---|---|
| Fresh | 15 min | 16 min | 18 min |
| Style | 38 min | 46 min | 59 min |
| Tech | 43 min | 55 min | 55 min |

---

### `calendar.csv` — Date Reference
**~912 records** (2024-01-01 to ~2026-12-31)

| Column | Type | Description |
|---|---|---|
| `date` | date (YYYY-MM-DD) | Calendar date |
| `dow` | int | Day of week (0=Mon, 6=Sun) |
| `dow_name` | string | Day name (Mon, Tue, ...) |
| `is_weekend` | int (0/1) | 1 = Saturday or Sunday |
| `iso_year` | int | ISO year |
| `iso_week` | int | ISO week number (1–53) |
| `is_payday` | int (0/1) | 1 = salary payday |
| `festival` | string | Festival name (blank if none) |
| `festival_ramp` | float (0–1) | Pre-festival demand ramp-up |
| `is_holiday` | int (0/1) | 1 = public holiday |
| `monsoon` | int (0/1) | 1 = monsoon season active |
| `is_operating` | int (0/1) | 0 = non-operating (Sundays) |

---

### `traffic_speed.csv` — Hourly Speed Index
**576 records** (12 districts × 24 hours × 2 monsoon states)

| Column | Type | Description |
|---|---|---|
| `district` | string | District |
| `hour` | int (0–23) | Hour of day |
| `monsoon` | int (0/1) | Monsoon flag |
| `speed_index` | int | Relative traffic speed (100 = free flow, lower = congested) |

**Key insight — Colombo peak congestion:**
| Hour | Normal Speed Index | Monsoon Speed Index |
|---|---|---|
| 6 AM | 68 | 54 |
| 7 AM | 47 | 36 |
| 8 AM | 46 | 33 |
| 9 AM | 55 | 43 |

---

## 📁 Training Data

### `deliveries_train.csv` — Historical Deliveries
**~92,308 records** (2024-01-01 onwards) | 13 MB

| Column | Type | Description |
|---|---|---|
| `delivery_id` | string | ORD0000001 format |
| `order_date` | date | When order was placed |
| `dispatch_date` | date | When dispatched |
| `dispatch_status` | string | e.g., `attempted` |
| `outlet_id` | string | Outlet receiving delivery |
| `brand` | enum | Fresh / Style / Tech |
| `district` | string | District |
| `depot` | string | Depot |
| `temp_requirement` | enum | `ambient` or `chilled` |
| `order_units` | int | Number of units |
| `order_weight_kg` | float | Weight kg |
| `order_volume_m3` | float | Volume m³ |
| `route_id` | string | Route this delivery is on |
| `seq_in_route` | int | Stop position in route |
| `vehicle_id` | string | Vehicle used |
| `vehicle_type` | string | truck / van |
| `vehicle_temp` | string | reefer / ambient |
| `planned_arrival_time` | time (HH:MM) | Planned arrival |
| `window_open_time` | time (HH:MM) | Window opens |
| `window_close_time` | time (HH:MM) | Window closes |

---

### `route_legs_train.csv` — Historical Route Legs with Actuals
**~91,895 records** | 12 MB

| Column | Type | Description |
|---|---|---|
| `leg_id` | string | L0000001 format |
| `date` | date | Date |
| `route_id` | string | Route |
| `depot` | string | Depot |
| `vehicle_id` | string | Vehicle |
| `vehicle_type` | string | truck / van |
| `vehicle_temp` | string | reefer / ambient |
| `brand` | string | Brand |
| `district` | string | District |
| `seq` | int | Leg sequence |
| `from_point` | string | DEPOT or outlet_id |
| `to_outlet` | string | Destination outlet_id |
| `distance_km` | float | Leg distance |
| `planned_depart_time` | time | Planned departure |
| `planned_travel_duration_min` | float | Planned travel time |
| `planned_arrival_time` | time | Planned arrival |
| `actual_depart_time` | time | ✅ **Actual** departure |
| `actual_travel_duration_min` | float | ✅ **Actual** travel time |
| `arrival_time` | time | ✅ **Actual** arrival at outlet |
| `leave_outlet_time` | time | ✅ Time leaving outlet (end of service) |
| `monsoon` | int | 0/1 |
| `dow` | int | Day of week |

> **Derived targets:**
> - `service_min = leave_outlet_time − arrival_time`
> - `is_late = arrival_time > window_close_time` (joined from deliveries)

---

## 📁 Test Data

### `task1_test_inputs.csv` — Task 1 Inputs
**5,015 records** | 724 KB

Same schema as `deliveries_train.csv` — no actual timings (those are what you predict).

### `route_legs_test.csv` — Task 1 Route Legs (Test)
**5,015 records** | 554 KB

Same schema as `route_legs_train.csv` **except**:
- No `actual_depart_time`, `actual_travel_duration_min`, `arrival_time`, `leave_outlet_time`

### `task2a_test_inputs.csv` — Task 2A Inputs
**60 records** | 1.7 KB

| Column | Description |
|---|---|
| `row_id` | W0000–W0059 |
| `depot` | Kandy or Peliyagoda |
| `brand` | Fresh / Style / Tech |
| `iso_year` | 2026 |
| `iso_week` | 14–23 |

### `task2b_peak_day_scenarios.csv` — Task 2B Orders
**86 records** | 8.7 KB

Full order details for Scenario S1 (see Task 2B doc for schema).

### `task2b_peak_day_fleet.csv` — Task 2B Vehicle Status
**38 records** (Peliyagoda fleet for S1) | 807 bytes

| Column | Description |
|---|---|
| `scenario` | S1 |
| `vehicle_id` | Vehicle |
| `status` | `available` or `in_workshop` |

---

## 📁 Submission Templates

### `submission_task1.csv`
- **5,015 rows**
- Columns: `delivery_id`, `pred_service_min`, `pred_late_prob`

### `submission_task2a.csv`
- **60 rows** (W0000–W0059)
- Columns: `row_id`, `pred_total_volume_m3`, `pred_chilled_volume_m3`

### `submission_task2b.csv`
- **86 rows** (S1-000 to S1-085)
- Columns: `scenario`, `order_ref`, `outlet_id`, `decision`, `vehicle_id`, `trip_id`
