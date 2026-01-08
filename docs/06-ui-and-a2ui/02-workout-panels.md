# Workout-Specific A2UI Panels

This document extends the base A2UI contract ([00-ui-contract.md](./00-ui-contract.md)) with **workout-specific panel schemas**.

## Design Goals

- **Markdown + Interactive coexist:** Full plan is readonly markdown, logging is interactive
- **No excessive tool calls:** Batch operations for set logging
- **Git-style diffs:** Plan changes shown as before/after comparison
- **Real-time feedback:** Compute e1RM and fatigue impact as user logs

---

## Panel 1: WorkoutMarkdownPanel

### Purpose

Display the **full workout plan** as readonly, copyable markdown.

### Schema

```json
{
  "type": "workout_markdown_panel",
  "id": "plan_view",
  "title": "Today's Workout Plan",
  "markdown": "## Upper Push - Week 2, Day 1\n\n**Target RPE:** 7-8...",
  "actions": [
    {"kind": "copy", "label": "Copy to clipboard"}
  ]
}
```

### User Actions

- **Read:** User can scroll and read plan
- **Copy:** Copy markdown to clipboard (for pasting elsewhere)

**No editing** — this is the source of truth from the agent.

---

## Panel 2: SetLoggerPanel

### Purpose

Interactive **per-exercise set logging** with real-time feedback.

### Schema

```json
{
  "type": "set_logger_panel",
  "id": "logger_bench",
  "exercise_name": "Bench Press",
  "exercise_id": "ex_bench",
  "workout_exercise_id": "we_123",
  "planned": {
    "sets": 3,
    "rep_range": "8-10",
    "rpe": 8.0,
    "load_lbs": 185
  },
  "sets": [
    {
      "set_number": 1,
      "weight_lbs": 185,
      "reps": 10,
      "rpe": 7.5,
      "rest_seconds": null,
      "notes": "",
      "e1rm": 245,  // computed client-side or server-returned
      "ssu": 1.82   // computed
    }
  ],
  "actions": [
    {"kind": "set.add", "label": "Add set"},
    {"kind": "set.save_all", "label": "Save all sets"}
  ]
}
```

### Fields (per set)

| Field          | Type   | Required | Notes |
|----------------|--------|----------|-------|
| set_number     | int    | yes      | Auto-incremented |
| weight_lbs     | number | yes      | Pre-filled from planned or last session |
| reps           | int    | yes      | User enters actual reps performed |
| rpe            | number | yes      | 0-10 scale, increments of 0.5 |
| rest_seconds   | int    | no       | Auto-tracked or manual |
| notes          | text   | no       | e.g., "felt sharp pain in elbow" |
| e1rm           | number | computed | Shown immediately after entry |
| ssu            | number | computed | Fatigue contribution |

### User Actions

- **set.add:** Add another set
- **set.delete(set_number):** Remove a set
- **set.save_all:** Batch save via `workout_sets_log_batch` tool

### Real-Time Feedback

As user enters weight, reps, RPE:
- **e1RM** computed instantly (from RPE table)
- **SSU** computed instantly
- **Comparison to last session:** "Last week: 185x9 @ RPE 8 (e1RM: 238). Today: +7 lbs e1RM!"

---

## Panel 3: PlanDiffPanel

### Purpose

Show **git-style before/after comparison** when agent proposes plan changes.

### Schema

```json
{
  "type": "plan_diff_panel",
  "id": "diff_week3_to_week4",
  "title": "Proposed Plan Changes",
  "reason": "Fatigue balance at -0.28 CTL (threshold: -0.20)",
  "before_markdown": "## Week 3 Plan\n\n1. Back Squat: 4x6-8 @ RPE 8...",
  "after_markdown": "## Week 4 Plan\n\n1. Hack Squat: 3x8-10 @ RPE 7...",
  "changes_summary": [
    "Quads volume: 16 sets → 12 sets (-4 sets)",
    "Swap: Back Squat → Hack Squat (knee pain flag)",
    "Load progression: HOLD (no increases this week)"
  ],
  "actions": [
    {"kind": "diff.accept", "label": "Accept changes"},
    {"kind": "diff.modify", "label": "Modify"},
    {"kind": "diff.deny", "label": "Keep current plan"}
  ]
}
```

### Visual Rendering

**Side-by-side diff:**
```
┌─────────────────────┬─────────────────────┐
│ BEFORE (Week 3)     │ AFTER (Week 4)      │
├─────────────────────┼─────────────────────┤
│ Back Squat          │ Hack Squat          │  ← changed
│ 4x6-8 @ RPE 8       │ 3x8-10 @ RPE 7      │  ← changed
│ 225 lbs             │ 205 lbs             │  ← changed
│                     │                     │
│ Leg Press           │ Leg Press           │  ← same
│ 3x10-12 @ RPE 8     │ 3x10-12 @ RPE 8     │
└─────────────────────┴─────────────────────┘
```

Or **unified diff** (GitHub-style):
```diff
- Back Squat: 4x6-8 @ RPE 8, 225 lbs
+ Hack Squat: 3x8-10 @ RPE 7, 205 lbs

  Leg Press: 3x10-12 @ RPE 8
```

### User Actions

- **diff.accept:** Apply changes immediately → agent updates plan
- **diff.modify:** Agent asks "What would you like to change?"
- **diff.deny:** Revert to current plan

**Critical:** Agent **never** applies changes without user approval via this panel.

---

## Panel 4: TimerWidget

### Purpose

Rest timer between sets (auto-start or manual).

### Schema

```json
{
  "type": "timer_widget",
  "id": "rest_timer",
  "mode": "countdown",  // or "stopwatch"
  "target_seconds": 180,
  "elapsed_seconds": 0,
  "status": "ready",  // "running", "paused", "completed"
  "auto_start": true,  // starts when set is logged
  "actions": [
    {"kind": "timer.start", "label": "Start"},
    {"kind": "timer.pause", "label": "Pause"},
    {"kind": "timer.reset", "label": "Reset"}
  ]
}
```

### Behavior

- **Auto-start (recommended):** When user saves a set → timer starts automatically
- **Manual:** User clicks "Start"
- **Notification:** Vibrate/sound when countdown completes

**Not prominent** — shown as small widget, doesn't dominate UI.

---

## Panel 5: FatigueDashboardPanel

### Purpose

Visualize **muscle-group-level fatigue** and readiness.

### Schema

```json
{
  "type": "fatigue_dashboard_panel",
  "id": "fatigue_dash",
  "title": "Fatigue & Readiness",
  "readiness_score": 72,
  "readiness_band": "normal",
  "atl": 145,
  "ctl": 160,
  "fb": 15,
  "fb_status": "balanced",
  "muscle_fatigue": [
    {
      "muscle_group": "quads",
      "weekly_hard_sets": 14,
      "mev": 8,
      "mav": 16,
      "mrv": 22,
      "status": "building",
      "bar_percent": 63  // 14/22 = 63% of MRV
    },
    {
      "muscle_group": "chest",
      "weekly_hard_sets": 18,
      "mev": 10,
      "mav": 16,
      "mrv": 22,
      "status": "peak",
      "bar_percent": 82
    }
  ],
  "warnings": [
    "Chest volume approaching MRV (18/22 sets)"
  ]
}
```

### Visual Rendering

**Readiness gauge:**
```
Readiness: 72 / 100  [========72%====    ]  NORMAL
```

**Fatigue balance:**
```
ATL: 145  CTL: 160  Balance: +15  ✓ BALANCED
```

**Muscle fatigue bars:**
```
Quads    [=========63%==========           ] 14/22 sets  ← building
Chest    [==============82%====            ] 18/22 sets  ⚠ peak
Lats     [======45%=======                 ]  9/20 sets  ← building
```

**Color coding:**
- Green: Under MAV (building)
- Yellow: MAV to MRV (peak volume)
- Red: Exceeding MRV (reduce)

---

## Panel 6: SessionSummaryPanel (post-workout)

### Purpose

Show **session summary** after workout completion.

### Schema

```json
{
  "type": "session_summary_panel",
  "id": "summary_123",
  "title": "Workout Complete!",
  "session_date": "2026-01-08",
  "duration_minutes": 68,
  "total_sets": 18,
  "total_reps": 156,
  "avg_rpe": 7.8,
  "ssu_total": 28.5,
  "volume_by_muscle": [
    {"muscle_group": "chest", "hard_sets": 6, "total_reps": 54},
    {"muscle_group": "triceps", "hard_sets": 4, "total_reps": 48}
  ],
  "prs": [
    {"exercise": "Bench Press", "e1rm": 252, "previous": 247, "improvement": "+5 lbs"}
  ],
  "notes": "Felt strong on bench, slight elbow discomfort on overhead work",
  "next_session": "2026-01-10 - Lower Day"
}
```

### Visual Rendering

```
✓ Workout Complete - Upper Push

Duration: 68 minutes
Volume: 18 sets, 156 reps, Avg RPE 7.8
Stress: 28.5 SSU

Muscle Groups:
- Chest: 6 hard sets, 54 reps
- Triceps: 4 hard sets, 48 reps

🎉 Personal Records:
- Bench Press: 252 lbs e1RM (+5 lbs from last week!)

Next: Lower Day - Friday, Jan 10
```

---

## Integration with Tools

### SetLoggerPanel → `workout_sets_log_batch`

When user clicks "Save all sets":

**UI emits:**
```json
{
  "kind": "ui.action",
  "action_type": "set.save_all",
  "panel_id": "logger_bench",
  "data": {
    "workout_exercise_id": "we_123",
    "sets": [
      {"set_number": 1, "weight_lbs": 185, "reps": 10, "rpe": 7.5},
      {"set_number": 2, "weight_lbs": 185, "reps": 9, "rpe": 8.0},
      {"set_number": 3, "weight_lbs": 185, "reps": 8, "rpe": 8.5}
    ]
  }
}
```

**Agent calls:**
```
workout_sets_log_batch({
  "workout_exercise_id": "we_123",
  "sets": [...]
})
```

**One tool call for all sets** (batch-first!).

---

### PlanDiffPanel → `workout_program_update`

When user clicks "Accept changes":

**UI emits:**
```json
{
  "kind": "ui.action",
  "action_type": "diff.accept",
  "panel_id": "diff_week3_to_week4",
  "data": {
    "diff_id": "diff_789"
  }
}
```

**Agent applies the changes** (updates program, regenerates plan).

---

## Summary

These workout panels extend the base A2UI to support:

1. **WorkoutMarkdownPanel:** Readonly full plan view
2. **SetLoggerPanel:** Interactive set-by-set logging with real-time e1RM/SSU
3. **PlanDiffPanel:** Git-style before/after for plan changes (NEVER SILENT EDITS)
4. **TimerWidget:** Rest timer (auto-start on set log)
5. **FatigueDashboardPanel:** Muscle fatigue visualization + readiness
6. **SessionSummaryPanel:** Post-workout recap with PRs and next session

All panels use **batch operations** and **structured actions** to minimize tool calls and maximize UX responsiveness.
