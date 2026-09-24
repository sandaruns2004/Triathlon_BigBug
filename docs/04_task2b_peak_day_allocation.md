# 04 · Task 2B — Peak-Day Vehicle Allocation

## 🎯 Objective

On a high-demand day when some vehicles are in the workshop for maintenance, **decide for each pending order** whether to:
- **Serve it today** (assign to a vehicle + trip)
- **Defer it to tomorrow**

The goal is to **maximise the number of orders served** while satisfying all operational constraints. A feasibility-failing submission **does not score**.

---

## 📁 Files Involved

| File | Path | Role |
|---|---|---|
| `task2b_peak_day_scenarios.csv` | `data/Test Data/` | Orders to allocate (Scenario S1) |
| `task2b_peak_day_fleet.csv` | `data/Test Data/` | Which vehicles are available/in_workshop |
| `vehicles.csv` | `data/General Data/` | Vehicle master — capacity, depot, type, temp |
| `outlets.csv` | `data/General Data/` | Outlet master — constraints |
| `district_travel.csv` | `data/General Data/` | Travel times for trip time calculation |
| `service_allowance.csv` | `data/General Data/` | Service times by brand & dock type |
| `submission_task2b.csv` | `data/Submission Templates/` | Template to fill |
| `check_allocation.py` | Project root | **Feasibility validator — run before submitting!** |

---

## 📐 Scenario: S1 (Peliyagoda Depot — Peak Day)

### Fleet Status (Peliyagoda vehicles only, S1)

From `task2b_peak_day_fleet.csv` — Scenario S1 involves **Peliyagoda depot** vehicles (VEH001–VEH038):

| Status | Vehicle IDs |
|---|---|
| **In Workshop (unavailable)** | VEH001, VEH002, VEH004, VEH005, VEH012, VEH016, VEH021, VEH022, VEH026, VEH035 |
| **Available** | VEH003, VEH006, VEH007, VEH008, VEH009, VEH010, VEH011, VEH013, VEH014, VEH015, VEH017, VEH018, VEH019, VEH020, VEH023, VEH024, VEH025, VEH027, VEH028, VEH029, VEH030, VEH031, VEH032, VEH033, VEH034, VEH036, VEH037, VEH038 |

> **28 available vehicles** out of 38 Peliyagoda vehicles

---

## 📋 Order Input Schema (`task2b_peak_day_scenarios.csv`)

| Column | Description |
|---|---|
| `scenario` | Scenario ID (S1) |
| `order_ref` | Order reference (S1-000, S1-001, ...) |
| `outlet_id` | Which outlet |
| `brand` | Fresh / Style / Tech |
| `district` | District of outlet |
| `depot` | Which depot (Peliyagoda for S1) |
| `dock_type` | rear_dock / street / mall_bay |
| `parking_constraint` | normal / van_only / mall_dock |
| `mall_window` | Mall dock time window (if applicable) |
| `window_open_time` | Outlet delivery window opens |
| `window_close_time` | Outlet delivery window closes |
| `temp_requirement` | ambient or chilled |
| `order_units` | Number of units |
| `order_weight_kg` | Weight of order |
| `order_volume_m3` | Volume of order |
| `deferred_yesterday` | 1 = was deferred yesterday (priority!) |
| `days_since_last_served` | Days since this outlet last received delivery |

---

## 📋 Submission Schema (`submission_task2b.csv`)

| Column | Description |
|---|---|
| `scenario` | Always S1 |
| `order_ref` | Must include every order (S1-000 to S1-085) |
| `outlet_id` | Outlet from scenarios (for reference) |
| `decision` | `served` or `deferred` |
| `vehicle_id` | Required if served (e.g., VEH014) |
| `trip_id` | Required if served (`1` or `2`) |

> **Every order must have a row.** Deferred orders still need a row with `decision=deferred`.

---

## ⚖️ Feasibility Rules (ALL must pass)

These are enforced by `check_allocation.py`:

### Rule 1: Vehicle Availability
- Vehicle must be `available` (not `in_workshop`) in the fleet file for Scenario S1

### Rule 2: Depot Match
- Vehicle must be based at the **same depot** as the orders it carries (Peliyagoda vehicles carry Peliyagoda orders)

### Rule 3: One Brand Per Trip
- Each trip (vehicle + trip_id combination) can only carry **one brand** (Fresh, Style, or Tech)

### Rule 4: One District Per Trip
- Each trip can only service outlets in **one district**

### Rule 5: Temperature Compatibility
- `chilled` orders → must use a **reefer** vehicle
- `ambient` orders → can use any vehicle

### Rule 6: Parking Constraint
- `van_only` outlets → must send a **van** (not a truck)
- `mall_dock` outlets → must use mall dock procedures

### Rule 7: Capacity Limits (per trip)
- Total `order_volume_m3` ≤ `volume_cap_m3` of vehicle
- Total `order_weight_kg` ≤ `weight_cap_kg` of vehicle

### Rule 8: Time Budget (per vehicle per day)
- **Fresh brand trips** → all Fresh trips by that vehicle ≤ **270 minutes** (03:30–08:00 window)
- **Non-Fresh brand trips** → all non-Fresh trips ≤ **480 minutes** (daytime window)

  **Trip time formula:**
  ```
  trip_time = depot_to_district_freeflow_min 
            + (n_stops - 1) × inter_stop_freeflow_min 
            + sum(service_allowance_min for each stop's dock_type)
  ```

### Rule 9: Max 2 Trips Per Vehicle
- Each vehicle can run at most **2 trips per day** (trip_id = 1 or 2)

---

## 🧮 Trip Time Calculation Reference

From `district_travel.csv`:

| District | Depot | Depot→District (min) | Inter-Stop (min) |
|---|---|---|---|
| Colombo | Peliyagoda | 24 | 8 |
| Gampaha | Peliyagoda | 37 | 9 |
| Kalutara | Peliyagoda | 64 | 12 |
| Galle | Peliyagoda | 103 | 9 |
| Matara | Peliyagoda | 137 | 10 |
| Kurunegala | Peliyagoda | 127 | 19 |
| Puttalam | Peliyagoda | 173 | 24 |

Example: 3 Fresh outlets in Colombo, all rear_dock:
```
trip_time = 24 + (3-1)×8 + 3×15 = 24 + 16 + 45 = 85 minutes
```

---

## 🛠️ Recommended Approach

### Phase 1: Parse & Categorize Orders

```python
import pandas as pd

scenarios = pd.read_csv('data/Test Data/task2b_peak_day_scenarios.csv')
fleet = pd.read_csv('data/Test Data/task2b_peak_day_fleet.csv')
vehicles = pd.read_csv('data/General Data/vehicles.csv').set_index('vehicle_id')
district_travel = pd.read_csv('data/General Data/district_travel.csv').set_index('district').to_dict('index')
service_allow = pd.read_csv('data/General Data/service_allowance.csv')
allowance = {(r.brand, r.dock_type): r.service_allowance_min for r in service_allow.itertuples()}

# Available vehicles for S1
avail_vehicles = fleet[fleet.scenario == 'S1'][fleet.status == 'available']['vehicle_id'].tolist()
orders = scenarios[scenarios.scenario == 'S1']
```

### Phase 2: Prioritization
Order priority for serving:
1. `deferred_yesterday = 1` (must-serve, SLA breach risk)
2. `days_since_last_served` (higher = more urgent)
3. Smaller orders (easier to fit in trips)
4. Outlets with tighter time windows (harder to defer)

### Phase 3: Group Orders into Trips
Trips must be same **brand + district**. Group compatible orders:

```python
# Group by (brand, district, depot) — only same-group orders can share a trip
for (brand, district), group in orders.groupby(['brand', 'district']):
    # Assign to vehicles respecting capacity and time budget
    ...
```

### Phase 4: Assign Vehicles
For each trip group:
- Select a vehicle that matches depot, temp requirement, and parking constraints
- Check capacity: sum volume and weight ≤ vehicle caps
- Check time budget: compute trip_time ≤ allowed budget
- Assign trip_id = 1 (or 2 if vehicle already has a trip 1)

### Phase 5: Validate Before Submitting
```bash
python check_allocation.py data/Submission\ Templates/submission_task2b.csv
```
→ Must output: `FEASIBILITY: PASSED - every rule satisfied.`

---

## 🔑 Available Reefer Vehicles (for chilled orders)

| Vehicle | Type | Weight Cap (kg) | Volume Cap (m³) |
|---|---|---|---|
| VEH003 | truck | 5,510 | 26.4 |
| VEH006 | truck | 6,840 | 33.4 |
| VEH007 | truck | 3,610 | 19.4 |
| VEH036 | van | 1,040 | 7.0 |

> VEH001, VEH002, VEH004, VEH005 are reefer but **in workshop** for S1.

---

## 🚐 Available Van Vehicles (for van_only outlets)

| Vehicle | Type | Temp | Weight Cap (kg) | Volume Cap (m³) |
|---|---|---|---|---|
| VEH036 | van | reefer | 1,040 | 7.0 |
| VEH037 | van | ambient | 1,100 | 8.0 |
| VEH038 | van | ambient | 1,200 | 9.0 |

> VEH035 (van, reefer) is **in workshop** for S1.

---

## ✅ Submission Checklist

- [ ] **86 rows** (S1-000 to S1-085 — every order has a row)
- [ ] Columns: `scenario`, `order_ref`, `outlet_id`, `decision`, `vehicle_id`, `trip_id`
- [ ] `decision` = `served` or `deferred` only
- [ ] Served orders have non-null `vehicle_id` and `trip_id`
- [ ] Deferred orders may have blank `vehicle_id` and `trip_id`
- [ ] `trip_id` = 1 or 2 only
- [ ] **Run `check_allocation.py` and get PASSED before submitting**
