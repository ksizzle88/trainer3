# Plan Changes & Diff UX

This document defines how the agent proposes and applies changes to workout plans.

## Core Principle: Never Silent Plan Edits

**Critical rule:** The agent **NEVER** silently changes a user's plan.

All plan modifications must be:
1. **Proposed** with clear rationale
2. **Visualized** via git-style diff
3. **User-approved** (Accept / Modify / Deny)

This is **NOT just audit mode**—it's the core coaching UX.

---

## When Plan Changes Happen

### Triggers for Plan Modification

1. **Fatigue signals**
   - FB < -0.20 * CTL (fatigue balance too negative)
   - Performance regression (e1RM dropping)
   - Readiness score < 40

2. **Pain or injury flags**
   - User reports pain during an exercise
   - Agent swaps exercise variation

3. **Volume adjustments**
   - Muscle group exceeding MRV
   - User requests more/less volume

4. **User-requested changes**
   - "Skip leg day this week"
   - "Add more arm work"
   - "I want to bench 4 times a week"

5. **Program progression**
   - End of mesocycle → deload week
   - Moving from accumulation to peak phase

---

## Diff Workflow

### Step 1: Agent Detects Need for Change

**Example scenario:**
```
Agent analyzes:
- FB = -32 (threshold: -30) → fatigue warning
- Quads: 18 hard sets this week (MRV: 20)
- User reported "knees felt sore" last session
```

### Step 2: Agent Generates Proposed Diff

**Diff structure:**
```json
{
  "diff_id": "diff_abc123",
  "reason": "Fatigue balance at -0.28 CTL (threshold: -0.20) + knee soreness reported",
  "changes": [
    {
      "type": "exercise_swap",
      "before": "Back Squat",
      "after": "Hack Squat",
      "rationale": "Reduce knee stress while maintaining quad stimulus"
    },
    {
      "type": "volume_reduction",
      "muscle_group": "quads",
      "before_sets": 16,
      "after_sets": 12,
      "rationale": "Approaching MRV with elevated fatigue"
    },
    {
      "type": "load_hold",
      "exercises": ["all"],
      "rationale": "No load progression this week to allow recovery"
    }
  ],
  "before_markdown": "## Week 3 Plan\n\n1. Back Squat: 4x6-8 @ RPE 8, 225 lbs...",
  "after_markdown": "## Week 4 Plan (Modified)\n\n1. Hack Squat: 3x8-10 @ RPE 7, 205 lbs..."
}
```

### Step 3: Agent Presents Diff to User

**Using PlanDiffPanel** (see [06-ui-and-a2ui/02-workout-panels.md](../06-ui-and-a2ui/02-workout-panels.md)):

```
Agent message:
"Based on your fatigue signals and knee soreness, I'm proposing some adjustments for next week.
Here's what I recommend changing:"

[PlanDiffPanel renders]

PROPOSED CHANGES (Week 3 → Week 4)

Reason: Fatigue balance at -0.28 CTL + knee soreness

Changes:
✓ Swap: Back Squat → Hack Squat (reduce knee stress)
✓ Quads volume: 16 sets → 12 sets (-4 sets, approaching MRV)
✓ Load progression: HOLD (no increases this week)

Expected outcome: Restore readiness while maintaining intensity

[Accept] [Modify] [Keep Current Plan]
```

### Step 4: User Decision

#### Option A: Accept

User clicks "Accept" → agent applies changes immediately:

```
Agent: "Changes applied. Your Week 4 plan is updated.
I'll check in after your first session to see how the Hack Squat feels."

[Updates workout_program, regenerates sessions]
```

#### Option B: Modify

User clicks "Modify" → agent asks for feedback:

```
Agent: "What would you like to adjust?"

User: "I'm okay with the volume reduction, but I want to keep Back Squat
and just reduce the load instead of swapping exercises."

Agent: "Got it. I'll reduce Back Squat to 3x8-10 @ RPE 7 with 185 lbs
(down from 225), and keep the volume reduction.
Sound good?"

[Regenerates diff with user's input]
```

#### Option C: Deny

User clicks "Keep Current Plan" → agent reverts:

```
Agent: "Understood. Your Week 3 plan stays unchanged.
I'll monitor your fatigue closely. If knee soreness persists,
please let me know."

[No changes applied, diff discarded]
```

---

## Diff Types

### 1. Exercise Swap

**Before:**
```
Back Squat: 4x6-8 @ RPE 8
```

**After:**
```
Hack Squat: 3x8-10 @ RPE 7
```

**Rationale:** Pain management, variation, equipment availability

---

### 2. Volume Adjustment

**Before:**
```
Quads: 16 hard sets this week
```

**After:**
```
Quads: 12 hard sets this week
```

**Rationale:** Fatigue, approaching MRV, deload

---

### 3. Load Progression

**Before:**
```
Bench Press: 185 lbs
```

**After:**
```
Bench Press: 190 lbs
```

**Rationale:** All sets hit top of rep range at target RPE

---

### 4. RPE Target Change

**Before:**
```
Target RPE: 8-9
```

**After:**
```
Target RPE: 7-8
```

**Rationale:** Fatigue management, deload week

---

### 5. Rep Range Change

**Before:**
```
3x6-8
```

**After:**
```
3x8-10
```

**Rationale:** Progression scheme adjustment, variation

---

### 6. Exercise Addition/Removal

**Before:**
```
1. Bench Press
2. Incline Press
3. Lateral Raises
```

**After:**
```
1. Bench Press
2. Incline Press
3. Lateral Raises
4. Face Pulls  ← ADDED
```

**Rationale:** Balance push/pull ratio, address weak point

---

## User Override Logging

When a user **explicitly requests** a change that breaks RP rules:

**Example:**
```
User: "I want to do 5 sets of heavy deadlifts today, not 3"

Agent: "That exceeds the recommended volume for deadlifts (MRV: 4 sets).
This will increase fatigue significantly.

Do you want to proceed?"

[User: Yes]

Agent: "Okay, I've updated today's plan to 5 sets.
I'm logging this as a user override for future reference."

[Logs override with reason: "user_requested"]
```

**Override record:**
```json
{
  "override_id": "ovr_456",
  "user_id": "user_123",
  "date": "2026-01-08",
  "rule_broken": "mrv_exceeded",
  "original_plan": "Deadlifts: 3x5 @ RPE 8",
  "user_override": "Deadlifts: 5x5 @ RPE 8",
  "rationale": "User explicitly requested higher volume",
  "outcome": "to_be_determined"
}
```

**Why log overrides:**
- Agent learns user preferences over time
- Can reference: "Last time you did 5 sets of deadlifts, your fatigue spiked for 3 days"
- Improves future recommendations

---

## Edge Cases

### User Asks for Change Mid-Session

**Scenario:**
```
User: "I just finished set 1 of squats and my knee hurts.
Can we switch to leg press?"
```

**Agent response:**
```
Agent: "Absolutely. Let's switch to Leg Press for the rest of this workout.

For future sessions, should I replace Back Squat with Leg Press,
or do you want to try it again next week?"

[Generates immediate session diff + optional program diff]
```

**Immediate change** (no diff needed for in-progress session) + optional program change (requires diff).

---

### Agent Proposes Change, User Ghosts

**Scenario:**
Agent presents diff, user doesn't respond.

**Behavior:**
```
Agent: "I haven't heard back about the proposed plan changes.
Your current plan is still active. Let me know if you'd like to review it."

[After 48 hours with no response: assume "Deny", keep current plan]
```

**Never assume "Accept" by default.**

---

### Conflicting Changes

**Scenario:**
Agent proposes volume reduction, but user simultaneously asks for volume increase.

**Resolution:**
```
Agent: "I was about to suggest reducing quad volume due to fatigue,
but you just asked to add more leg work.

Can we find a middle ground? Options:
1. Keep current volume (16 sets) but reduce intensity (RPE 7 instead of 8)
2. Add volume to a different muscle group (glutes/hamstrings instead of quads)
3. Proceed with your request, but I'll monitor fatigue closely"
```

**Agent mediates conflict, explains tradeoffs.**

---

## Integration with Audit Mode

### Audit Mode On

In audit mode, **all plan changes** require operator approval (not just user approval):

**Flow:**
1. Agent proposes diff → user accepts
2. Diff sent to audit console for operator review
3. Operator approves → change applied
4. Operator denies → reverted, user notified

**Audit console shows:**
```
Pending Approval: Plan Change

User: jane@example.com
Agent proposed: Reduce quad volume 16→12 sets
User response: Accepted
Reason: Fatigue balance -0.28 CTL

[Approve] [Deny]
```

---

## Summary

**Plan changes are:**
- **Never silent** (always proposed explicitly)
- **Visualized** (git-style diffs with before/after)
- **User-controlled** (Accept / Modify / Deny)
- **Logged** (overrides tracked for learning)
- **Explained** (agent always states rationale)

**This is NOT optional** — it's the core coaching UX that builds trust.

The PlanDiffPanel ([06-ui-and-a2ui/02-workout-panels.md](../06-ui-and-a2ui/02-workout-panels.md)) is the primary UI for this workflow.
