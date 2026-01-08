# RP Programming Concepts

This document describes the Renaissance Periodization (RP) training principles that underpin the workout planning system.

## Overview

The agent uses RP-style programming as its **default training framework**. This provides:
- Evidence-based volume guidelines
- Progressive overload structure
- Fatigue management
- Systematic deload triggers

## Core Concepts

### Volume Landmarks (per muscle group, per week)

Each muscle group has three key volume thresholds:

- **MEV (Minimum Effective Volume)**: The lowest weekly volume that produces progress
- **MAV (Maximum Adaptive Volume)**: The "sweet spot" for optimal gains
- **MRV (Maximum Recoverable Volume)**: The red line—beyond this, recovery degrades

**Default ranges by experience level:**

| Experience    | MEV      | MAV       | MRV       |
|---------------|----------|-----------|-----------|
| Beginner      | 6-8 sets | 10-12 sets| 14-16 sets|
| Intermediate  | 8-10 sets| 12-16 sets| 18-22 sets|
| Advanced      | 10-12 sets| 14-20 sets| 22-26 sets|

These are starting points—the agent adapts them based on individual response.

### Effort Standards (RPE-based)

**RPE = Rate of Perceived Exertion** (scale 0-10)

- **Compounds** (squats, deadlifts, bench, rows): 5-10 reps @ **RPE 7-9**
  - Most sets: RPE 7-8
  - Occasional top sets: RPE 9
  - Rarely pushed to 10 (testing only)

- **Accessories** (lateral raises, curls, leg extensions): 8-20 reps @ **RPE 7-10**
  - Later sets can approach RPE 9-10
  - Isolation movements safer to push near failure

### Progression Rules

**Within-session progression:**
- If all work sets hit **top of rep range** at **≤ target RPE** → increase load next session
- If top reps missed OR RPE exceeds target by ≥ 1.0 → hold load (or reduce 2.5-5%)
- If exercise stalls 2 sessions in a row → swap variation or reduce volume

**Example:**
```
Target: 3 sets x 8-12 reps @ RPE 8
Session 1: 100 lbs x 12, 12, 11 @ RPE 8
→ All sets hit top range at target RPE
→ Next session: increase to 105 lbs

Session 2: 105 lbs x 10, 9, 8 @ RPE 8
→ Did not hit top range
→ Next session: hold 105 lbs
```

## Periodization Structure

### Mesocycle (4-6 weeks)

The core RP training block:

**Week 1-3/4:** Volume accumulation
- Gradually add 1-3 hard sets per muscle per week
- Load progression when rep+RPE targets met
- Monitor readiness and fatigue signals

**Week 4/5:** Peak MAV week
- Highest volume of the block
- Most demanding training
- Close monitoring for recovery

**Week 5/6:** Deload
- Volume reduced 30-50%
- Intensity maintained or slightly reduced
- Restore readiness for next mesocycle

### Deload Triggers

A deload is triggered when **any 2** of these occur:

1. Performance regression (e1RM trend down ≥2.5%)
2. ATL > CTL by threshold (fatigue balance too negative)
3. Elevated soreness/fatigue scores
4. Readiness trend declining
5. Subjective "I feel cooked" flag from user

**Deload prescription:**
- Reduce volume 30-50%
- Keep intensity similar (same weights, fewer sets)
- Duration: 1 week typically

## Coaching Modes

The agent operates in different modes depending on user goals and context:

### Mode A: RP-Core (Default)
- Strict volume landmarks
- Conservative load jumps
- Predictable progression
- Best for hypertrophy blocks

### Mode B: RP-Flexible (Recommended for Real Life)
- RP rules generate the base plan
- Day-of adjustments allowed based on readiness
- Volume and exercise swaps permitted within guardrails
- Adapts to sports, stress, life events

### Mode C: Performance / Event Prep
- Fatigue management prioritized
- Volume caps enforced earlier
- Conditioning and sport load dominate decisions
- Conservative approach to prevent overtraining

### Mode D: Minimal Effective / Maintenance
- Floor MEV only
- Used during travel, busy weeks, or extended deloads
- Focus on retention, not progression

## Change Proposal System

**Critical rule:** The agent **never silently changes the plan**.

When adaptation is needed:
1. Agent generates a **proposed diff** (what changes + why)
2. Presents it to the user via PlanDiffPanel
3. User chooses: **Accept / Modify / Deny**

**Example diff:**
```
PROPOSED CHANGES (Week 3 → Week 4)

Reason: Fatigue balance at -0.28 CTL (threshold: -0.20)

Changes:
- Quads volume: 16 sets → 12 sets (-4 sets)
- Swap: Back Squat → Hack Squat (knee pain note from last session)
- Load progression: HOLD (no increases this week)

Expected outcome: Restore readiness while maintaining intensity
```

## Rule-Breaking Policy

The agent is **always allowed** to break RP rules when:
- User explicitly asks
- Safety/recovery requires it
- Performance data suggests a different approach

**However, the agent must:**
- State which rule is being broken
- Explain the tradeoff
- Log the override for future learning

**Example:**
```
User: "I want to do 5 sets of heavy deadlifts today"

Agent: "This breaks RP-Core volume guidelines (3 sets recommended).
5 sets at RPE 8+ exceeds MAV for this exercise pattern.

Tradeoff: Higher acute fatigue, increased recovery demand.

I'll log this as user override. Watch for fatigue signals this week."
```

## Integration with Platform

These RP concepts are implemented as:

- **Skill docs** loaded by the agent when planning workouts
- **Data model** in [04-data-model/01-workouts.md](../04-data-model/01-workouts.md)
- **Fatigue formulas** in [04-data-model/02-fatigue.md](../04-data-model/02-fatigue.md)
- **Tools** for volume tracking and progression suggestions

The agent doesn't hardcode these rules—they're part of the workout capability bundle, making them operator-editable via the Studio (future).
