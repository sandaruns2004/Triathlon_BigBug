# 01 · Challenge Overview — Datathon 2026

## Business Context

The challenge is based on **Waypoint Group**, a Sri Lankan retail group that operates three brands sharing one distribution network. For the Datathon, the brand names are referred to as Fresh/Style/Tech:

| Brand (Datathon name) | Waypoint Brand | Delivery Window | Temperature |
|---|---|---|---|
| **Fresh** | Waypoint Fresh (80 outlets) | Pre-dawn (03:30–08:00) | Refrigerated (reefer) |
| **Style** | Waypoint Style (25 outlets) | Daytime (09:00–17:00) | Ambient |
| **Tech** | Waypoint Tech (15 outlets) | Daytime (09:00–17:00) | Ambient |

> **Designathon/Hackathon context:** The same company is the basis for the **Waypoint Flow** system being designed and built in Days 1–10. The Datathon data underpins the allocation and prediction logic that the Hackathon must implement.

The company operates from **two depots**:
- **Peliyagoda** — serves Western and Southern Sri Lanka
- **Kandy** — serves Central Sri Lanka

---

## 🗺️ Coverage Areas

| Depot | Districts Served |
|---|---|
| Peliyagoda | Colombo, Gampaha, Kalutara, Galle, Matara, Kurunegala, Puttalam |
| Kandy | Kandy, Matale, Nuwara Eliya, Badulla, Kegalle |

---

## 🚚 Fleet Overview

**60 vehicles total** across both depots:

| Category | Peliyagoda | Kandy |
|---|---|---|
| Truck – Reefer | 7 | 5 |
| Truck – Ambient | 27 | 13 |
| Van – Reefer | 2 | 2 |
| Van – Ambient | 2 | 2 |
| **Total** | **38** | **22** |

Vehicle IDs: VEH001–VEH038 (Peliyagoda), VEH039–VEH060 (Kandy)

---

## 🏪 Outlet Network

**120 outlets** (OUT001–OUT120) across all districts and brands. Each outlet has:
- A brand affiliation (Fresh / Style / Tech)
- A district and depot assignment
- A dock type (rear_dock / street / mall_bay)
- A parking constraint (normal / van_only / mall_dock)
- A delivery time window (open_time → close_time)
- Optional mall delivery window

---

## 📊 The Three Tasks

### Task 1 — Delivery Service Time & Late Probability Prediction
Predict, for each delivery in the test set:
1. `pred_service_min` — How many minutes will the actual service at the outlet take?
2. `pred_late_prob` — What is the probability (0–1) that the delivery arrives late?

### Task 2A — Weekly Volume Forecasting
For a given depot + brand + ISO week combination, predict:
1. `pred_total_volume_m3` — Total delivery volume (m³) for the week
2. `pred_chilled_volume_m3` — Chilled product volume (m³) for that week

### Task 2B — Peak-Day Vehicle Allocation
On a high-demand day with some vehicles in the workshop, decide for each pending order:
- `decision`: `served` or `deferred`
- If served: which `vehicle_id` and which `trip_id` (1 or 2)

---

## 📂 Data Available

| Dataset | Location | Purpose |
|---|---|---|
| `deliveries_train.csv` | Training Data | ~92K delivery records, Jan 2024 onward |
| `route_legs_train.csv` | Training Data | ~92K route leg records with actual timings |
| `task1_test_inputs.csv` | Test Data | ~5K deliveries to predict |
| `route_legs_test.csv` | Test Data | Route legs for test deliveries |
| `task2a_test_inputs.csv` | Test Data | 60 week-depot-brand combos to forecast |
| `task2b_peak_day_scenarios.csv` | Test Data | Orders for peak day (Scenario S1) |
| `task2b_peak_day_fleet.csv` | Test Data | Vehicle availability for peak day |
| `vehicles.csv` | General Data | Fleet master — capacity, depot, temp |
| `outlets.csv` | General Data | Outlet master — brand, district, constraints |
| `calendar.csv` | General Data | 2024–2026 calendar with flags |
| `district_travel.csv` | General Data | Travel time & distance parameters |
| `traffic_speed.csv` | General Data | Hourly speed index by district & monsoon |
| `service_allowance.csv` | General Data | Planned service time by brand & dock type |

---

## 🎯 Scoring & What Matters

- **Task 1:** Accuracy of `pred_service_min` (regression) and `pred_late_prob` (probability calibration)
- **Task 2A:** Accuracy of volume predictions
- **Task 2B:** Maximize orders served while satisfying ALL feasibility constraints. Feasibility is checked by `check_allocation.py` — a submission that fails feasibility **will not score**

---

## ⚠️ Important Constraints (Datathon Specific)

1. **Feasibility first for Task 2B** — must pass the checker before any scoring
2. **Deadlines are strict** — no late submissions
3. Use the exact submission template column names
4. `sunday = non-operating day` (is_operating=0 in calendar)
