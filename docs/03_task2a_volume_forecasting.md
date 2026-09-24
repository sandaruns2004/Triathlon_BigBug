# 03 · Task 2A — Weekly Volume Forecasting

## 🎯 Objective

For each combination of **(depot × brand × ISO week)** in the test set, forecast:

| Output Column | Type | Description |
|---|---|---|
| `pred_total_volume_m3` | Float | Total delivery volume (m³) dispatched that week |
| `pred_chilled_volume_m3` | Float | Volume (m³) of chilled products in that week |

---

## 📁 Files Involved

| File | Path | Role |
|---|---|---|
| `deliveries_train.csv` | `data/Training Data/` | Historical deliveries — aggregate by week |
| `calendar.csv` | `data/General Data/` | Date flags: payday, festival, holiday, monsoon |
| `task2a_test_inputs.csv` | `data/Test Data/` | 60 rows — what to forecast |
| `submission_task2a.csv` | `data/Submission Templates/` | Template to fill |

---

## 📐 Test Input Schema (`task2a_test_inputs.csv`)

| Column | Description |
|---|---|
| `row_id` | Unique ID (W0000 – W0059) |
| `depot` | Kandy or Peliyagoda |
| `brand` | Fresh / Style / Tech |
| `iso_year` | Year (2026) |
| `iso_week` | ISO week number |

### Test Set Coverage
- **10 ISO weeks** (weeks 14–23 of 2026, i.e., ~30 Mar – 5 Jun 2026)
- **2 depots × 3 brands = 6 combinations per week**
- **Total: 60 forecast rows**

---

## 📊 Submission Template (`submission_task2a.csv`)

| Column | Description |
|---|---|
| `row_id` | Must match test inputs exactly (W0000–W0059) |
| `pred_total_volume_m3` | Your predicted total volume |
| `pred_chilled_volume_m3` | Your predicted chilled volume |

---

## 🔑 Key Factors for Forecasting

### Calendar Effects
From `calendar.csv`:
- **`is_payday`** — paydays drive demand spikes (month-end)
- **`festival`** — major festivals (Thai Pongal, etc.) strongly affect demand
- **`festival_ramp`** — ramp-up variable (0.0 to 1.0) in days leading to festival
- **`is_holiday`** — public holidays can reduce or redistribute demand
- **`monsoon`** — affects road conditions and potentially delivery volumes
- **`is_weekend`** — weekend deliveries behave differently (Sundays = non-operating)

### Week-Level Aggregation Strategy
```python
import pandas as pd

deliveries = pd.read_csv('data/Training Data/deliveries_train.csv')
cal = pd.read_csv('data/General Data/calendar.csv')

# Parse dates
deliveries['dispatch_date'] = pd.to_datetime(deliveries['dispatch_date'])
cal['date'] = pd.to_datetime(cal['date'])

# Get ISO week/year
deliveries['iso_year'] = deliveries['dispatch_date'].dt.isocalendar().year
deliveries['iso_week'] = deliveries['dispatch_date'].dt.isocalendar().week

# Weekly aggregate by depot + brand
weekly = deliveries.groupby(['depot', 'brand', 'iso_year', 'iso_week']).agg(
    total_volume_m3=('order_volume_m3', 'sum'),
    chilled_volume_m3=('order_volume_m3', lambda x: x[deliveries.loc[x.index, 'temp_requirement'] == 'chilled'].sum()),
).reset_index()
```

### Calendar Features per Week
```python
# Aggregate calendar flags to ISO week level
cal['iso_year'] = pd.to_datetime(cal['date']).dt.isocalendar().year
cal['iso_week'] = pd.to_datetime(cal['date']).dt.isocalendar().week

week_cal = cal.groupby(['iso_year', 'iso_week']).agg(
    n_operating_days=('is_operating', 'sum'),
    n_paydays=('is_payday', 'sum'),
    n_holidays=('is_holiday', 'sum'),
    max_festival_ramp=('festival_ramp', 'max'),
    n_monsoon_days=('monsoon', 'sum'),
    has_festival=('festival', lambda x: x.notna().any()),
).reset_index()
```

---

## 📈 Historical Patterns to Discover

| Pattern | Description |
|---|---|
| Trend | Volume may grow over time (business expansion) |
| Seasonality | Weekly/monthly repeating patterns |
| Payday peaks | End-of-month buying spikes |
| Pre-festival ramp | Demand surges 1 week before major festivals |
| Monsoon dip | Rain can reduce outlet footfall and order volumes |
| Fresh vs Style/Tech | Fresh has higher volume but more predictable patterns |
| Peliyagoda dominance | Western Province has larger population — higher volumes |

---

## 🛠️ Recommended Models

### Option A: Gradient Boosted Regressor (Recommended)
```python
from lightgbm import LGBMRegressor
from sklearn.model_selection import TimeSeriesSplit

features = ['depot', 'brand', 'iso_week', 'n_operating_days', 
            'n_paydays', 'max_festival_ramp', 'n_monsoon_days',
            'week_of_year_sin', 'week_of_year_cos',  # cyclical encoding
            'lag_1_volume', 'lag_4_volume', 'lag_52_volume']  # lags

model = LGBMRegressor(n_estimators=500, learning_rate=0.05)
```

### Option B: Prophet / ARIMA per Series
For each (depot, brand) pair, run a time-series model:
```python
from prophet import Prophet

# One model per depot-brand combination (6 models total)
for (depot, brand), group in weekly.groupby(['depot', 'brand']):
    m = Prophet(weekly_seasonality=True)
    m.fit(group.rename(columns={'dispatch_date_monday': 'ds', 'total_volume_m3': 'y'}))
    future = m.make_future_dataframe(periods=10, freq='W')
    forecast = m.predict(future)
```

---

## 🔢 Volume Distribution by Brand (Expected)

| Brand | Temp | Expected Pattern |
|---|---|---|
| Fresh | Ambient + Chilled | Highest daily volume; daily operations |
| Style | Ambient only | Medium volume; more discretionary |
| Tech | Ambient only | Lower volume; larger per-unit weight |

> **chilled_volume_m3 ≤ total_volume_m3** always — verify this constraint in your predictions

---

## ✅ Submission Checklist

- [ ] 60 rows (W0000–W0059)
- [ ] Columns: `row_id`, `pred_total_volume_m3`, `pred_chilled_volume_m3`
- [ ] `pred_chilled_volume_m3` ≤ `pred_total_volume_m3` for every row
- [ ] Both values > 0 (cannot forecast negative volume)
- [ ] Fresh and Tech brands only have chilled volume for Fresh (Style/Tech are ambient — chilled should be 0 or near 0)
- [ ] No null values

> ⚠️ **Note:** Style and Tech products are ambient-only. For those rows, `pred_chilled_volume_m3` should be **0.0**.
