# Data model — fatigue & performance tracking

This document defines the **mathematical formulas** for fatigue modeling, performance tracking, and readiness scoring.

## Goals

- **Coach-grade accuracy** (not just "feels tired")
- **Real-time computability** (no expensive batch jobs)
- **Explainable** (agent can show why it's suggesting a deload)
- **RPE-first** (works without wearables or fancy equipment)

## Core Metrics

We compute 4 families of signals:

1. **e1RM trends** (performance tracking)
2. **Session stress** (lifting + conditioning load)
3. **Fatigue state** (acute vs chronic load)
4. **Readiness** (subjective + objective)

---

## 1. Performance: e1RM from (Weight, Reps, RPE)

### RPE-to-%1RM Table

We use a standard RPE chart to map (reps, RPE) → %1RM:

| Reps | RPE 6 | RPE 6.5 | RPE 7 | RPE 7.5 | RPE 8 | RPE 8.5 | RPE 9 | RPE 9.5 | RPE 10 |
|------|-------|---------|-------|---------|-------|---------|-------|---------|--------|
| 1    | 89%   | 91%     | 92%   | 94%     | 96%   | 98%     | 99%   | 100%    | 100%   |
| 2    | 86%   | 88%     | 89%   | 91%     | 92%   | 94%     | 96%   | 98%     | 100%   |
| 3    | 83%   | 85%     | 86%   | 88%     | 89%   | 91%     | 93%   | 96%     | 98%    |
| 4    | 80%   | 82%     | 84%   | 85%     | 87%   | 89%     | 91%   | 94%     | 96%    |
| 5    | 77%   | 79%     | 81%   | 83%     | 85%   | 87%     | 89%   | 92%     | 94%    |
| 6    | 75%   | 77%     | 79%   | 81%     | 83%   | 85%     | 87%   | 90%     | 92%    |
| 7    | 73%   | 75%     | 77%   | 79%     | 81%   | 83%     | 85%   | 88%     | 91%    |
| 8    | 71%   | 73%     | 75%   | 77%     | 79%   | 81%     | 84%   | 86%     | 89%    |
| 9    | 69%   | 71%     | 73%   | 75%     | 77%   | 80%     | 82%   | 85%     | 88%    |
| 10   | 67%   | 69%     | 71%   | 73%     | 76%   | 78%     | 81%   | 83%     | 86%    |
| 12   | 64%   | 66%     | 68%   | 70%     | 73%   | 75%     | 78%   | 80%     | 83%    |
| 15   | 60%   | 62%     | 65%   | 67%     | 70%   | 72%     | 75%   | 77%     | 80%    |
| 20   | 56%   | 58%     | 61%   | 63%     | 66%   | 69%     | 71%   | 74%     | 77%    |

### e1RM Calculation

For a given set:
- `w` = weight used (lbs)
- `r` = reps performed
- `rpe` = RPE reported

**Formula:**
```
pct_1rm = lookup_table(r, rpe)  # from table above
e1rm = w / pct_1rm
```

**Example:**
- Set: 185 lbs x 8 reps @ RPE 8
- pct_1rm = 0.79 (from table)
- e1rm = 185 / 0.79 = **234 lbs**

### e1RM Trend (per exercise)

For each exercise, track:
- `best_e1rm_today` = max(e1rm over all work sets)
- `avg_e1rm_7d` = 7-day rolling average
- `avg_e1rm_21d` = 21-day baseline

**Performance Regression Flag:**
```
IF avg_e1rm_7d < avg_e1rm_21d * 0.975  # 2.5% drop
  AND readiness is not improving
THEN flag "Performance Regression"
```

This triggers deload consideration.

---

## 2. Lifting Stress: Set Stress Units (SSU)

We want stress to scale with:
- Number of hard sets
- Effort (RPE)
- Load/intensity (%1RM)
- Reps (fatigue is not linear with reps)

### SSU Formula (per set)

**Inputs:**
- `w` = weight (lbs)
- `r` = reps
- `rpe` = RPE

**Derived:**
- `pct_1rm` = lookup_table(r, rpe)

**Components:**
```
intensity_factor = (pct_1rm / 0.70) ^ 2
  # 70% as "moderate" anchor; squared increases cost for heavy work

effort_factor = 1 + 0.10 * max(0, rpe - 6)
  # RPE 6 → 1.0, RPE 7 → 1.1, RPE 8 → 1.2, RPE 9 → 1.3, RPE 10 → 1.4

rep_factor = 0.6 + 0.07 * r
  # Keeps low reps meaningful, ramps with reps
  # r=3 → 0.81, r=8 → 1.16, r=12 → 1.44
```

**SSU for one set:**
```
SSU_set = intensity_factor * effort_factor * rep_factor
```

**Example:**
- Set: 185 lbs x 8 reps @ RPE 8
- pct_1rm = 0.79
- intensity_factor = (0.79 / 0.70)^2 = 1.27
- effort_factor = 1 + 0.10 * (8 - 6) = 1.20
- rep_factor = 0.6 + 0.07 * 8 = 1.16
- **SSU_set = 1.27 * 1.20 * 1.16 = 1.77**

### SSU per Exercise / Session

**Per exercise:**
```
SSU_exercise = sum(SSU_set for all work sets)
```

**Per session:**
```
SSU_session = sum(SSU_exercise for all exercises)
```

**Notes:**
- Warmup sets excluded (or counted at 20% weight)
- Accessories have high reps but lower intensity → formula balances them

---

## 3. Conditioning Stress: CSU

For non-lifting work (intervals, zone 2, etc.).

### Phase 1 Formula (no wearables)

**Inputs:**
- `work_minutes` = actual work time
- `rpe_session` = session RPE (0-10)

**Formula:**
```
CSU = work_minutes * (1 + 0.15 * (rpe_session - 5))
```

**Examples:**
- 20 min HIIT @ RPE 9: CSU = 20 * (1 + 0.15 * 4) = 20 * 1.60 = **32**
- 45 min Zone 2 @ RPE 5: CSU = 45 * (1 + 0) = **45**

### Daily Total Training Stress

```
TS_day = SSU_session + CSU_session
```

---

## 4. Fatigue State: ATL / CTL

We use **Exponentially Weighted Moving Averages (EWMA)** for stability and responsiveness.

### ATL (Acute Training Load) — 7-day EWMA

Represents **recent fatigue**.

**Formula:**
```
alpha_a = 2 / (7 + 1) = 0.25

ATL_today = ATL_yesterday + alpha_a * (TS_today - ATL_yesterday)
```

**Interpretation:**
- ATL responds quickly to recent training
- Spikes after hard sessions
- Drops quickly during rest

### CTL (Chronic Training Load) — 28-day EWMA

Represents **fitness/adaptation**.

**Formula:**
```
alpha_c = 2 / (28 + 1) ≈ 0.069

CTL_today = CTL_yesterday + alpha_c * (TS_today - CTL_yesterday)
```

**Interpretation:**
- CTL changes slowly
- Reflects long-term training capacity
- High CTL = well-adapted

### Fatigue Balance

```
FB_today = CTL_today - ATL_today
```

**Interpretation:**
- FB > 0: Chronic load exceeds acute → **fresh** (deloading or tapering)
- FB ≈ 0: Balanced
- FB < 0: Acute load exceeds chronic → **fatigued**

**Deload Triggers:**
```
IF FB < -0.20 * CTL  → fatigue warning
IF FB < -0.35 * CTL  → deload strongly suggested
```

**Example:**
- CTL = 150
- ATL = 180
- FB = 150 - 180 = **-30**
- Threshold: -0.20 * 150 = **-30** → ⚠️ Warning triggered

---

## 5. Readiness Score (0-100)

Readiness blends **subjective** and **objective** signals.

### Inputs

**Subjective (user-reported):**
- `sleep_hours` (or sleep quality 0-10)
- `soreness` (0-10, 0 = none, 10 = debilitating)
- `stress` (0-10, 0 = calm, 10 = overwhelmed)
- `motivation` (0-10, 0 = none, 10 = fired up)

**Objective (computed):**
- `FB` = fatigue balance

### Component Scores (normalized to 0-100)

```
sleep_score = clamp((sleep_hours - 5) / 3, 0, 1) * 100
  # 5 hours → 0, 8 hours → 100

soreness_score = (1 - soreness / 10) * 100
  # 0 soreness → 100, 10 soreness → 0

stress_score = (1 - stress / 10) * 100

motivation_score = (motivation / 10) * 100

fatigue_score = clamp(FB / (0.25 * CTL), -1, 1) * 50 + 50
  # FB = 0 → 50 (neutral)
  # FB = -0.25*CTL → 0 (very fatigued)
  # FB = +0.25*CTL → 100 (very fresh)
```

### Final Readiness

Weighted blend:
```
Readiness = 0.25 * sleep_score
          + 0.20 * soreness_score
          + 0.15 * stress_score
          + 0.15 * motivation_score
          + 0.25 * fatigue_score
```

**Readiness Bands:**
- **80-100:** Push (add sets, increase load, top sets)
- **60-79:** Normal (follow plan)
- **40-59:** Reduce volume 10-20% or cap RPE at 8
- **<40:** Deload or recovery session

---

## 6. Muscle-Group-Level Fatigue

### Hard Set Accounting

For each muscle group, track weekly **hard sets**:

```
FOR each set in workout_sets:
  IF rpe >= 7:
    hard_set_count = 1
  ELIF rpe >= 6 AND rpe < 7:
    hard_set_count = 0.5  # partial credit
  ELSE:
    hard_set_count = 0

  FOR each muscle in exercise.muscle_weights:
    muscle_hard_sets[muscle] += hard_set_count * muscle_weights[muscle]
```

**Example:**
- Back Squat: {quads: 0.6, glutes: 0.3, adductors: 0.1}
- 3 sets @ RPE 8
- Quads: +1.8 hard sets
- Glutes: +0.9 hard sets
- Adductors: +0.3 hard sets

### Muscle SSU

Similarly, compute stress per muscle:

```
FOR each set:
  SSU_set = (computed as above)
  FOR each muscle:
    muscle_SSU[muscle] += SSU_set * muscle_weights[muscle]
```

### Volume Guidance

Compare weekly hard sets to RP landmarks:

```
IF hard_sets < MEV:
  status = "under-stimulated"
ELIF hard_sets >= MEV AND hard_sets < MAV:
  status = "building" → consider adding sets
ELIF hard_sets >= MAV AND hard_sets < MRV:
  status = "peak volume" → monitor fatigue
ELSE:
  status = "exceeding MRV" → reduce volume or deload
```

---

## Data Storage

### Computed Tables/Views

**Daily aggregates:**
```sql
CREATE TABLE daily_training_metrics (
  user_id UUID,
  date DATE,
  ssu_total NUMERIC,
  csu_total NUMERIC,
  ts_total NUMERIC,  -- SSU + CSU
  atl NUMERIC,
  ctl NUMERIC,
  fb NUMERIC,
  readiness_score INTEGER,
  PRIMARY KEY (user_id, date)
);
```

**Exercise performance trends:**
```sql
CREATE TABLE exercise_e1rm_trends (
  user_id UUID,
  exercise_id UUID,
  date DATE,
  best_e1rm NUMERIC,
  avg_e1rm_7d NUMERIC,
  avg_e1rm_21d NUMERIC,
  PRIMARY KEY (user_id, exercise_id, date)
);
```

**Muscle group volume:**
```sql
CREATE TABLE weekly_muscle_volume (
  user_id UUID,
  muscle_group TEXT,
  week_start_date DATE,
  hard_sets NUMERIC,
  total_ssu NUMERIC,
  mev NUMERIC,  -- from user's program
  mav NUMERIC,
  mrv NUMERIC,
  PRIMARY KEY (user_id, muscle_group, week_start_date)
);
```

---

## Tools

### Read Tools

#### `fatigue_dashboard_get`

**Args:**
```json
{
  "date": "2026-01-08"  // optional, defaults to today
}
```

**Returns:**
```json
{
  "readiness_score": 72,
  "atl": 145,
  "ctl": 160,
  "fb": 15,
  "fb_threshold_warning": -32,  // -0.20 * CTL
  "fb_threshold_deload": -56,   // -0.35 * CTL
  "status": "normal",
  "muscle_fatigue": [
    {
      "muscle_group": "quads",
      "weekly_hard_sets": 14,
      "mav": 16,
      "mrv": 22,
      "status": "building"
    }
  ]
}
```

---

#### `performance_trends_get`

**Args:**
```json
{
  "exercise_id": "ex_backsquat",
  "days": 30
}
```

**Returns:**
```json
{
  "exercise_name": "Back Squat",
  "current_e1rm": 315,
  "avg_e1rm_7d": 310,
  "avg_e1rm_21d": 318,
  "regression_flag": true,
  "trend": [
    {"date": "2026-01-01", "best_e1rm": 320},
    {"date": "2026-01-04", "best_e1rm": 312},
    {"date": "2026-01-07", "best_e1rm": 308}
  ]
}
```

---

## Agent Usage

The agent uses these metrics to:

1. **Suggest load progression** (e1RM trending up → increase weight)
2. **Trigger deloads** (FB < threshold OR e1RM regressing)
3. **Adjust daily volume** (readiness < 60 → reduce sets)
4. **Warn about overtraining** (muscle hard sets > MRV)
5. **Explain decisions** ("Your ATL is 30 points above CTL, suggesting a deload")

All formulas are **transparent and explainable** to the user.

---

## Future Enhancements

**Phase 2+:**
- HRV integration (Heart Rate Variability)
- Wearable data (resting HR, sleep stages, step count)
- Per-exercise RPE bias calibration
- Machine learning for personalized thresholds

**Not in v1.**
