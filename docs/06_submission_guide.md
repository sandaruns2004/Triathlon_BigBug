# 06 · Submission Guide

## Datathon Deadline

> **Day 15 — 9 October 2026 · 11:59 PM**

All three submission files must be submitted by the deadline. There are **no extensions**.

---

## Submission Files Overview

| File | Template Location | Rows | Key Columns |
|---|---|---|---|
| `submission_task1.csv` | `data/Submission Templates/` | 5,015 | `delivery_id`, `pred_service_min`, `pred_late_prob` |
| `submission_task2a.csv` | `data/Submission Templates/` | 60 | `row_id`, `pred_total_volume_m3`, `pred_chilled_volume_m3` |
| `submission_task2b.csv` | `data/Submission Templates/` | 86 | `scenario`, `order_ref`, `outlet_id`, `decision`, `vehicle_id`, `trip_id` |

---

## Task 1 Submission — `submission_task1.csv`

### Format
```
delivery_id,pred_service_min,pred_late_prob
ORD0092308,18.5,0.12
ORD0092309,22.1,0.08
...
```

### Rules
- One row per `delivery_id` from `task1_test_inputs.csv`
- No extra rows, no missing rows (5,015 total)
- `pred_service_min`: positive float, in minutes
- `pred_late_prob`: float in [0.0, 1.0] — a probability
- No null/blank values

### Validation Script (manual check)
```python
import pandas as pd
sub = pd.read_csv('data/Submission Templates/submission_task1.csv')
test = pd.read_csv('data/Test Data/task1_test_inputs.csv')
assert set(sub.delivery_id) == set(test.delivery_id), "Delivery IDs don't match"
assert sub.pred_service_min.notna().all(), "Nulls in pred_service_min"
assert sub.pred_late_prob.between(0, 1).all(), "pred_late_prob out of range"
print("Task 1 submission OK")
```

---

## Task 2A Submission — `submission_task2a.csv`

### Format
```
row_id,pred_total_volume_m3,pred_chilled_volume_m3
W0000,1245.3,320.5
W0001,415.2,0.0
...
```

### Rules
- One row per `row_id` from `task2a_test_inputs.csv` (W0000–W0059)
- `pred_total_volume_m3`: positive float
- `pred_chilled_volume_m3`: float ≥ 0 AND ≤ `pred_total_volume_m3`
- For Style and Tech brands → `pred_chilled_volume_m3 = 0.0`
- No null/blank values

### Validation Script
```python
import pandas as pd
sub = pd.read_csv('data/Submission Templates/submission_task2a.csv')
test = pd.read_csv('data/Test Data/task2a_test_inputs.csv')
assert set(sub.row_id) == set(test.row_id), "row_ids don't match"
assert (sub.pred_chilled_volume_m3 <= sub.pred_total_volume_m3).all(), "chilled > total"
assert sub.pred_total_volume_m3.gt(0).all(), "Zero or negative total volume"
print("Task 2A submission OK")
```

---

## Task 2B Submission — `submission_task2b.csv`

### Format
```
scenario,order_ref,outlet_id,decision,vehicle_id,trip_id
S1,S1-000,OUT001,served,VEH037,1
S1,S1-001,OUT001,deferred,,
S1,S1-002,OUT002,served,VEH037,1
...
```

### Rules
- One row per order_ref in `task2b_peak_day_scenarios.csv`
- `decision` = `served` or `deferred` only
- If `served`: `vehicle_id` and `trip_id` must be filled
- If `deferred`: `vehicle_id` and `trip_id` can be blank
- `trip_id` must be `1` or `2`
- All feasibility rules must pass (see Task 2B doc)

### Validation — MANDATORY before submitting
```bash
# Run from project root
python check_allocation.py "data/Submission Templates/submission_task2b.csv"
```

**Expected output on success:**
```
FEASIBILITY: PASSED - every rule satisfied.
```

**On failure:**
```
FEASIBILITY: FAILED  (N problem(s))
  - [S1 VEH003 trip 1] volume 35.2 m3 exceeds capacity 26.4 m3
  - ...
```

Fix all listed issues and rerun until PASSED.

---

## Pre-Submission Checklist

### Task 1
- [ ] 5,015 rows exactly
- [ ] All `delivery_id` values match test inputs
- [ ] No nulls in any column
- [ ] `pred_service_min` > 0 for all rows
- [ ] `pred_late_prob` between 0.0 and 1.0 for all rows

### Task 2A
- [ ] 60 rows exactly (W0000–W0059)
- [ ] `pred_chilled_volume_m3` ≤ `pred_total_volume_m3` for all rows
- [ ] Style and Tech rows have `pred_chilled_volume_m3 = 0`
- [ ] No nulls

### Task 2B
- [ ] 86 rows exactly (S1-000 to S1-085)
- [ ] `decision` column has only `served` or `deferred`
- [ ] All served orders have `vehicle_id` and `trip_id`
- [ ] `check_allocation.py` outputs **FEASIBILITY: PASSED**
- [ ] No duplicated (scenario, order_ref) pairs

---

## Contact for Issues
Email: **tech-triathlon@rootcode.io**

---

## Important Notes

> ⚠️ The submission portal/platform details were provided in the kick-off session. Check with the team leader for submission platform URL.

> ⚠️ Submit well before the deadline — do not wait until the last minute. **9 October 2026 · 11:59 PM** (Day 15) is the hard cutoff.
