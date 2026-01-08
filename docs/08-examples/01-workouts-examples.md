# Workouts Examples

This document shows concrete examples of the **workouts capability** in action.

## Skill Bundle Structure

The workouts skill follows the same format as weights (see [00-weights-examples.md](./00-weights-examples.md)).

### `capability.json`

```json
{
  "capability_id": "workouts",
  "version": "latest",
  "name": "Workout Planning & Logging",
  "description": "Plan, execute, and track resistance training with RP-style programming",
  "intent_triggers": [
    "workout",
    "lift",
    "training",
    "squat",
    "bench",
    "deadlift",
    "sets",
    "reps",
    "program"
  ]
}
```

---

### `skill.md` (condensed)

```markdown
---
capability_id: workouts
version: latest
---

# Workouts Skill

## When to use

Use when the user:
- Logs a training session
- Asks to plan a workout
- Reviews past sessions
- Requests program adjustments

## Default behavior

- **Weight unit:** lbs (convert if needed)
- **RPE scale:** 0-10
- **List limit:** last 10 sessions
- **Batch operations:** Always use `workout_sets_log_batch` (not individual saves)

## Movement Patterns

Exercises are categorized by movement pattern:

- **squat** (quads, glutes, adductors)
- **hinge** (glutes, hamstrings, erectors)
- **horizontal_push** (chest, triceps, anterior delts)
- **vertical_push** (shoulders, triceps)
- **horizontal_pull** (lats, traps, rhomboids, biceps)
- **vertical_pull** (lats, biceps)
- **carry** (core, forearms, traps)

## RP Programming Rules

See [01-product/01-rp-programming.md](../01-product/01-rp-programming.md) for full details.

**Key landmarks:**
- MEV / MAV / MRV per muscle group
- RPE 7-9 for compounds
- Deload when FB < -0.20 * CTL OR e1RM regressing

## Tools

### Read
- `workout_session_list` — recent sessions
- `workout_session_get` — full session details
- `exercise_search` — find exercises by name/pattern

### Write
- `workout_session_create` — create new session
- `workout_sets_log_batch` — log sets in batch
- `workout_session_complete` — mark session done

## UI

- **WorkoutMarkdownPanel:** Full plan view (readonly)
- **SetLoggerPanel:** Interactive set logging
- **PlanDiffPanel:** Plan change proposals
- **FatigueDashboardPanel:** Readiness + muscle fatigue

## Examples

### Example 1: User says "I want to log today's workout"

**Agent:**
1. Loads workouts skill (if not already loaded)
2. Asks: "What did you train today? (e.g., 'upper push', 'leg day')"
3. User: "Upper push"
4. Agent calls `workout_session_create` with session_type="upper_push"
5. Renders WorkoutMarkdownPanel with today's planned workout
6. Renders SetLoggerPanel for each exercise

---

### Example 2: User pastes workout log from notes

**User:**
```
Bench Press
185x10, 185x9, 185x8 @ RPE 8

Incline DB Press
60x12, 60x11, 60x10 @ RPE 8

Lateral Raises
25x15, 25x15, 25x14 @ RPE 9
```

**Agent:**
1. Parses text
2. Creates session via `workout_session_create`
3. Calls `workout_sets_log_batch` for each exercise
4. Responds: "Logged your upper push session. Here's the summary:
   - Bench Press: 3 sets, avg e1RM 247 lbs (+5 from last week!)
   - Total: 9 sets, 26.5 SSU
   - Chest hard sets this week: 12/16 (building toward MAV)"

---

### Example 3: Agent proposes deload

**Agent analyzes:**
- FB = -35 (threshold: -30)
- Quads e1RM: 315 → 305 over past 2 weeks
- User readiness: 55/100

**Agent:**
"Your fatigue balance is at -35 (threshold: -30), and quad strength is down 10 lbs over the past two weeks. I'm recommending a deload week.

[PlanDiffPanel shows]

PROPOSED CHANGES (Week 4 → Deload Week)

Reason: Fatigue balance -0.29 CTL + performance regression

Changes:
✓ Volume: Reduce all muscle groups by 40%
✓ Intensity: Keep loads, reduce sets (e.g., 4 sets → 2 sets)
✓ RPE: Cap at 7 (no grinding)

Expected outcome: Restore readiness, prepare for next mesocycle

[Accept] [Modify] [Keep Current Plan]"

---

### Example 4: Mid-session adjustment

**User (during workout):**
"I just did a set of squats and my knee hurts. Should I stop?"

**Agent:**
"Yes, stop squatting immediately. Let's switch to a knee-friendly alternative.

Options:
1. Leg Press (similar quad stimulus, less knee stress)
2. Bulgarian Split Squat (unilateral, adjustable depth)
3. Skip quad work today and focus on hamstrings/glutes

Which sounds best?"

**User:** "Leg Press"

**Agent:**
"Got it. I've updated today's session:
- Removed: Back Squat
- Added: Leg Press, 3x10-12 @ RPE 7

For future sessions, should I replace squats with leg press permanently, or try squats again next week?"

[Logs pain flag: knee, Back Squat, 2026-01-08]

---

### Example 5: User requests more volume

**User:**
"I want to add more arm work to my program"

**Agent:**
"Currently, you're doing:
- Triceps: 12 hard sets/week (MAV: 14, MRV: 18)
- Biceps: 10 hard sets/week (MAV: 12, MRV: 16)

You have room to add:
- Triceps: +2-6 sets
- Biceps: +2-6 sets

What would you like to add?"

**User:** "Add 2 sets of curls to upper days"

**Agent:**
[Generates diff]

PROPOSED CHANGES

Reason: User requested more arm volume

Changes:
✓ Add: Barbell Curl 2x10-12 @ RPE 8 to Upper Pull days
✓ New biceps volume: 10 → 14 sets/week (at MAV)

[Accept] [Modify] [Keep Current]

**User:** Accept

**Agent:** "Added! Your upper pull sessions now include curls. I'll monitor how you recover with the extra volume."

---

## Typical Session Flow

### Phase 1: Session Start

```
User: "Time to work out"

Agent: "Let's do it! Today's plan: Lower Day - Week 2, Day 3

[WorkoutMarkdownPanel]
## Lower Day - Week 2, Day 3

**Readiness:** 78/100 (NORMAL - follow plan)

1. Back Squat: 4x6-8 @ RPE 8, 225 lbs
2. Romanian Deadlift: 3x8-10 @ RPE 7, 185 lbs
3. Leg Press: 3x10-12 @ RPE 8, 360 lbs
4. Leg Curl: 3x12-15 @ RPE 9

Ready to start? I'll log as you go."
```

---

### Phase 2: Logging Sets

```
User: "First set of squats: 225x8 @ RPE 7.5"

Agent: "Logged! e1RM: 289 lbs, SSU: 1.85
Rest 3 minutes before set 2."

[SetLoggerPanel updates, rest timer starts]

User: "Set 2: 225x7 @ RPE 8"

Agent: "Logged! e1RM: 281 lbs
One more set to hit your target. Aim for 6-8 reps."

User: "Set 3: 225x7 @ RPE 8.5"

Agent: "Logged! Nice work.
Summary: 3 sets, avg e1RM 285 lbs (down 10 lbs from last week)
Note: Strength dip—could be fatigue. Let's see how the rest of the session goes."
```

---

### Phase 3: Session Complete

```
User: "Done!"

Agent calls: workout_session_complete(session_id)

Agent: [SessionSummaryPanel]

✓ Workout Complete - Lower Day

Duration: 72 minutes
Volume: 13 sets, 112 reps, Avg RPE 7.9
Stress: 22.8 SSU

Muscle Groups:
- Quads: 4 hard sets
- Glutes: 3 hard sets
- Hamstrings: 6 hard sets

Notes:
- Squat e1RM down 10 lbs—possible fatigue signal
- Otherwise solid session

Weekly Progress:
- Quads: 14/16 sets (building toward MAV)
- Hamstrings: 12/14 sets

Next: Upper Push - Friday, Jan 10
```

---

## Error Handling

### Exercise Not Found

**User:** "Log my workout: Klokov Press"

**Agent:**
"I don't recognize 'Klokov Press' in the exercise library.
Could you describe it? (e.g., 'It's a behind-the-neck press with a snatch grip')

Or, I can search for similar exercises:
- Overhead Press
- Behind-the-Neck Press
- Push Press"

**User:** "It's like a behind-the-neck press"

**Agent:** "Got it. I'll log it as 'Behind-the-Neck Press' for now.
I've also flagged 'Klokov Press' as a new variant to add to the library."

---

### Invalid RPE

**User:** "Set 1: 225x8 @ RPE 12"

**Agent:** "RPE should be 0-10 (10 = maximal effort).
Did you mean RPE 10, or was it a different number?"

---

### Missing Weight

**User:** "Set 1: 8 reps @ RPE 8"

**Agent:** "What weight did you use for that set?"

**User:** "185"

**Agent:** "Logged! 185 lbs x 8 @ RPE 8, e1RM: 234 lbs"

---

## Integration with Fatigue Model

After every session, the agent:
1. Computes SSU for the session
2. Updates ATL/CTL
3. Checks FB against thresholds
4. Updates muscle-group weekly volume
5. Flags warnings (exceeding MRV, e1RM regression, etc.)

**Example warning:**
```
Agent (after session):
"Heads up: Your chest volume this week is now 18/22 sets (82% of MRV).
You have one more upper push session this week.
Consider capping it at 4 sets instead of 6 to avoid overreaching."
```

---

## Summary

The workouts capability:
- Uses RP programming as default framework
- Tracks performance via e1RM and SSU
- Proposes plan changes via PlanDiffPanel (never silent!)
- Supports mid-session adjustments
- Integrates with fatigue model for autoregulation

All examples follow the batch-first, user-approval-required design patterns.
