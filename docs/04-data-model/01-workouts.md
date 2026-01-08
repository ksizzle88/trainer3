# Data model — workouts

Workouts are significantly more complex than weights. This document defines the complete workout domain.

## Design Principles

- **Movement patterns over specific exercises** (squat pattern, not "back squat")
- **Batch operations** for set logging (minimize tool calls)
- **RPE-first tracking** (RIR optional)
- **Multi-muscle attribution** (one exercise trains multiple muscle groups)
- **Program-agnostic storage** (supports RP, 5/3/1, custom, etc.)

## Canonical Decisions

- **Weight unit:** lbs (convert if needed)
- **RPE scale:** 0-10 (0 = no effort, 10 = maximal)
- **RIR (Reps in Reserve):** Optional, derived from RPE if needed (RIR ≈ 10 - RPE)
- **Tempo:** Optional (future enhancement)
- **Rest periods:** Tracked but not enforced

## Entities

### `exercises`

The exercise library—movement patterns and variants.

Fields:
- `id` (uuid)
- `name` (text) — e.g., "Back Squat", "Goblet Squat", "Bulgarian Split Squat"
- `movement_pattern` (text) — e.g., "squat", "hinge", "horizontal_push", "vertical_pull"
- `equipment` (text) — e.g., "barbell", "dumbbell", "bodyweight", "machine"
- `muscle_weights` (jsonb) — muscle group attribution, e.g.:
  ```json
  {
    "quads": 0.6,
    "glutes": 0.3,
    "adductors": 0.1
  }
  ```
- `is_compound` (boolean) — true for multi-joint movements
- `notes` (text) — coaching cues, contraindications
- `created_at`, `updated_at`

**Not user-specific** — shared exercise library across all users.

---

### `workout_programs`

A training program (mesocycle, block, etc.).

Fields:
- `id` (uuid)
- `user_id` (uuid) — **multi-tenancy**
- `name` (text) — e.g., "Hypertrophy Block 1"
- `start_date` (date)
- `end_date` (date, nullable)
- `training_mode` (text) — e.g., "rp_core", "rp_flexible", "performance", "maintenance"
- `weekly_schedule` (jsonb) — e.g.:
  ```json
  {
    "monday": "upper_push",
    "wednesday": "lower",
    "friday": "upper_pull",
    "saturday": "conditioning"
  }
  ```
- `volume_targets` (jsonb) — per muscle group MEV/MAV/MRV:
  ```json
  {
    "quads": {"mev": 8, "mav": 14, "mrv": 20},
    "chest": {"mev": 10, "mav": 16, "mrv": 22}
  }
  ```
- `status` (text) — "active", "completed", "paused"
- `created_at`, `updated_at`

---

### `workout_sessions`

A planned or completed workout.

Fields:
- `id` (uuid)
- `user_id` (uuid)
- `program_id` (uuid, nullable) — link to program (if part of one)
- `session_date` (date)
- `session_type` (text) — e.g., "upper_push", "lower", "full_body"
- `planned_markdown` (text) — the coach's proposed plan (markdown)
- `status` (text) — "planned", "in_progress", "completed", "skipped"
- `started_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)
- `notes` (text) — user's session notes
- `readiness_score` (integer, 0-100, nullable) — pre-session readiness
- `created_at`, `updated_at`

**Planned markdown example:**
```markdown
## Upper Push - Week 2, Day 1

**Target RPE:** 7-8 on compounds, 8-9 on accessories

1. Bench Press: 3x8-10 @ RPE 8
   - Suggested load: 185 lbs
2. Incline Dumbbell Press: 3x10-12 @ RPE 8
   - Suggested load: 60 lbs per hand
3. Lateral Raises: 3x12-15 @ RPE 9
4. Overhead Tricep Extension: 3x12-15 @ RPE 9
```

---

### `workout_exercises`

Exercises within a session (planned or actual).

Fields:
- `id` (uuid)
- `session_id` (uuid)
- `exercise_id` (uuid) — references `exercises`
- `order_index` (integer) — exercise order in session (1, 2, 3, ...)
- `planned_sets` (integer)
- `planned_rep_range_min` (integer)
- `planned_rep_range_max` (integer)
- `planned_rpe` (numeric(3,1)) — e.g., 8.0
- `planned_load_lbs` (numeric(6,2), nullable) — suggested weight
- `notes` (text) — exercise-specific notes (e.g., "tempo 3-0-1-0")
- `created_at`, `updated_at`

---

### `workout_sets`

Individual set logging—the core tracking entity.

Fields:
- `id` (uuid)
- `workout_exercise_id` (uuid) — references `workout_exercises`
- `set_number` (integer) — 1, 2, 3, ...
- `weight_lbs` (numeric(6,2))
- `reps` (integer)
- `rpe` (numeric(3,1)) — e.g., 8.5
- `rir` (integer, nullable) — reps in reserve (optional)
- `tempo` (text, nullable) — e.g., "3-0-1-0" (eccentric-pause-concentric-pause)
- `rest_seconds` (integer, nullable) — actual rest taken
- `notes` (text, nullable) — set-specific notes (e.g., "felt sharp pain in knee")
- `logged_at` (timestamptz) — when set was logged
- `created_at`, `updated_at`

**Computed fields** (not stored, derived on read):
- `e1rm` — estimated 1RM based on (weight, reps, RPE)
- `ssu` — Set Stress Units (see [02-fatigue.md](./02-fatigue.md))

---

### `muscle_groups` (reference table)

Standard muscle group taxonomy.

Fields:
- `id` (text) — e.g., "quads", "chest", "lats"
- `name` (text) — "Quadriceps", "Chest", "Latissimus Dorsi"
- `category` (text) — "legs", "push", "pull", "core"

**Pre-seeded values:**
- quads, glutes, hamstrings, calves, adductors
- chest, anterior_delts, lateral_delts, posterior_delts, triceps
- lats, traps, rhomboids, biceps, forearms
- abs, obliques, erectors

---

## Tools

### Read Tools

#### `workout_session_list`

List recent workout sessions for the user.

**Args:**
```json
{
  "limit": 30,
  "cursor": null,
  "status": "completed"  // optional filter
}
```

**Returns:**
```json
{
  "sessions": [
    {
      "id": "sess_123",
      "session_date": "2026-01-07",
      "session_type": "upper_push",
      "status": "completed",
      "readiness_score": 75
    }
  ],
  "next_cursor": "..."
}
```

---

#### `workout_session_get`

Get full details of a session including all exercises and sets.

**Args:**
```json
{
  "session_id": "sess_123"
}
```

**Returns:**
```json
{
  "session": {
    "id": "sess_123",
    "session_date": "2026-01-07",
    "planned_markdown": "...",
    "exercises": [
      {
        "exercise_id": "ex_bench",
        "name": "Bench Press",
        "order_index": 1,
        "planned_sets": 3,
        "sets": [
          {
            "set_number": 1,
            "weight_lbs": 185,
            "reps": 10,
            "rpe": 8.0,
            "e1rm": 247
          }
        ]
      }
    ]
  }
}
```

---

#### `exercise_search`

Search the exercise library.

**Args:**
```json
{
  "query": "squat",
  "movement_pattern": "squat",  // optional
  "equipment": "barbell"  // optional
}
```

**Returns:**
```json
{
  "exercises": [
    {
      "id": "ex_backsquat",
      "name": "Back Squat",
      "movement_pattern": "squat",
      "equipment": "barbell",
      "is_compound": true
    }
  ]
}
```

---

### Write Tools

#### `workout_session_create`

Create a new workout session (planned or started).

**Args:**
```json
{
  "session_date": "2026-01-08",
  "session_type": "lower",
  "planned_markdown": "## Lower Day...",
  "exercises": [
    {
      "exercise_id": "ex_backsquat",
      "order_index": 1,
      "planned_sets": 4,
      "planned_rep_range_min": 6,
      "planned_rep_range_max": 8,
      "planned_rpe": 8.0,
      "planned_load_lbs": 225
    }
  ],
  "readiness_score": 80
}
```

**Returns:**
```json
{
  "session_id": "sess_124"
}
```

---

#### `workout_session_update`

Update session status or notes.

**Args:**
```json
{
  "session_id": "sess_124",
  "status": "completed",
  "notes": "Felt strong today"
}
```

---

#### `workout_sets_log_batch`

Log multiple sets at once (batch operation).

**Args:**
```json
{
  "workout_exercise_id": "we_456",
  "sets": [
    {
      "set_number": 1,
      "weight_lbs": 225,
      "reps": 8,
      "rpe": 7.5,
      "rest_seconds": 180
    },
    {
      "set_number": 2,
      "weight_lbs": 225,
      "reps": 8,
      "rpe": 8.0,
      "rest_seconds": 180
    },
    {
      "set_number": 3,
      "weight_lbs": 225,
      "reps": 7,
      "rpe": 8.5,
      "rest_seconds": null
    }
  ]
}
```

**Returns:**
```json
{
  "logged": 3,
  "set_ids": ["set_1", "set_2", "set_3"]
}
```

**Policy:** Write tool, requires approval in audit mode.

---

#### `workout_session_start`

Mark a session as in-progress.

**Args:**
```json
{
  "session_id": "sess_124"
}
```

**Side effect:** Sets `started_at` timestamp and `status = "in_progress"`.

---

#### `workout_session_complete`

Mark a session as completed.

**Args:**
```json
{
  "session_id": "sess_124"
}
```

**Side effect:** Sets `completed_at` timestamp and `status = "completed"`.

---

## RP Programming Integration

### Volume Tracking

Compute **hard sets per muscle group per week**:

```sql
SELECT
  muscle_group,
  SUM(hard_sets) as weekly_hard_sets
FROM (
  SELECT
    unnest(array_keys(e.muscle_weights)) as muscle_group,
    COUNT(DISTINCT ws.id) * (e.muscle_weights->>(unnest(array_keys(e.muscle_weights))))::numeric as hard_sets
  FROM workout_sets ws
  JOIN workout_exercises we ON ws.workout_exercise_id = we.id
  JOIN workout_sessions wsess ON we.session_id = wsess.id
  JOIN exercises e ON we.exercise_id = e.id
  WHERE wsess.user_id = ?
    AND wsess.session_date >= current_date - interval '7 days'
    AND ws.rpe >= 7  -- hard set threshold
  GROUP BY e.id, muscle_group
) AS muscle_set_counts
GROUP BY muscle_group;
```

This enables the agent to check: "Are quads at MAV this week?"

### Progression Suggestions

For next session, agent checks:
- Did all sets hit top of rep range at ≤ target RPE?
  - YES → suggest +5 lbs (or +2.5 lbs for upper body accessories)
  - NO → suggest same weight

### Deload Detection

Agent checks weekly:
- Performance regression (e1RM trends down)
- Fatigue balance (see [02-fatigue.md](./02-fatigue.md))
- Readiness scores declining

If deload triggered → reduce volume 30-50%, keep intensity.

---

## Default UI

**Workout Plan View:**
- Rendered as markdown (planned_markdown)
- Readonly, copyable

**Set Logger:**
- Interactive table per exercise
- Pre-filled with planned values
- User edits: weight, reps, RPE
- Batch save when done

**Session Summary:**
- Volume per muscle group (hard sets)
- Average RPE
- e1RM trends
- Fatigue impact (SSU)

---

## Future Enhancements

**Phase 2+:**
- Tempo tracking (eccentric/concentric speed)
- Video form checks (computer vision)
- Exercise substitution suggestions
- Auto-generate programs from templates
- Wearable integration (heart rate, HRV)

**Not in v1.**
