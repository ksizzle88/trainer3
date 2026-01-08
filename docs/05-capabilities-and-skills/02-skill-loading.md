# Skill Loading Protocol

This document defines **how the agent discovers, requests, and loads skills** on-demand.

## Overview

Skills are loaded **dynamically** when the agent needs them, not all upfront. This keeps:
- Context windows small
- Agent responses fast
- Capability registry as single source of truth

## Discovery: How Does the Agent Know What Exists?

### Registry Index

The agent has access to a **capability index** tool:

#### `capability_registry_list`

**Returns:**
```json
{
  "capabilities": [
    {
      "capability_id": "weights",
      "name": "Weight Tracking",
      "description": "Log and track body weight over time",
      "intent_triggers": ["weigh-in", "bodyweight", "weight log"]
    },
    {
      "capability_id": "workouts",
      "name": "Workout Planning & Logging",
      "description": "Plan, execute, and track resistance training",
      "intent_triggers": ["workout", "lift", "squat", "training session"]
    },
    {
      "capability_id": "meals",
      "name": "Meal Tracking",
      "description": "Log meals and track nutrition",
      "intent_triggers": ["meal", "food", "calories", "macros"]
    }
  ]
}
```

**When to call:**
- On session start (light index, just IDs + triggers)
- When user intent is unclear
- Periodically to check for new capabilities (operator published something)

### Intent Matching

The agent uses `intent_triggers` to decide which skill to load:

**Example:**
```
User: "I just weighed 187.6 lbs"

Agent reasoning:
- Scans intent_triggers
- "weigh" matches "weigh-in" → capability_id = "weights"
- Calls capability_skill_load("weights")
```

---

## Loading: Get the Skill Bundle

### `capability_skill_load`

**Args:**
```json
{
  "capability_id": "weights"
}
```

**Returns:**
```json
{
  "capability_id": "weights",
  "version": "latest",  // v1: no semver, just "latest"
  "skill_doc": "# Weights skill\n\n## When to use...",
  "tools": [
    {
      "name": "weight_entry_list",
      "description": "List recent weight entries",
      "args_schema": {...},
      "policy": {"kind": "read"}
    },
    {
      "name": "weight_entry_save_batch",
      "description": "Save weight entries in batch",
      "args_schema": {...},
      "policy": {"kind": "write", "requires_approval": true}
    }
  ],
  "ui_schemas": [
    {
      "schema_id": "WeightEntryForm.v1",
      "definition": {...}
    },
    {
      "schema_id": "WeightBatchEditor.v1",
      "definition": {...}
    }
  ]
}
```

**What the agent receives:**
1. **skill_doc:** Markdown instructions (when to use, defaults, examples)
2. **tools:** Available tool contracts (name, args, policy)
3. **ui_schemas:** A2UI component schemas for rendering forms/editors

---

## Phase 1: No Versioning

For v1, we simplify:
- Every capability has **one version: "latest"**
- `capability_id` is enough to load
- No semver ranges, no compatibility checks

**Why:**
- Faster iteration
- Fewer edge cases
- Versioning added later when actually needed

**Breaking changes:**
- Create a new `capability_id` (e.g., "weights_v2")
- Migrate users explicitly
- Deprecate old capability

---

## Multi-Skill Loading

The agent can load **multiple skills in one session**:

**Example:**
```
User: "Log my workout and weigh-in"

Agent:
1. Loads "workouts" skill
2. Loads "weights" skill
3. Uses both in same response
```

**How it works:**
- Agent maintains a **loaded skills cache** for the session
- Each skill's tools are namespaced (no collisions)
- Agent references skill docs as needed

**Session state:**
```json
{
  "user_id": "user_123",
  "loaded_skills": ["weights", "workouts"],
  "context": {...}
}
```

---

## Fallback: Skill Not Found

### `capability_skill_load` fails

**Scenario:**
User asks about a feature that doesn't exist yet.

**Response:**
```json
{
  "error": {
    "code": "CAPABILITY_NOT_FOUND",
    "message": "No capability found for ID 'sleep_tracking'",
    "available_capabilities": ["weights", "workouts", "meals"]
  }
}
```

**Agent behavior:**
```
Agent: "I don't have a sleep tracking capability yet.
Currently available: weight tracking, workouts, and meal logging.

Would you like me to log sleep in your workout notes for now,
or would you prefer to track it elsewhere?"
```

**Key:** Agent doesn't fail silently—it explains and offers alternatives.

---

## Skill Caching & Refresh

### Session-Level Cache

Skills are cached **per session**:
- First load: fetch from registry
- Subsequent uses: use cached version

**Cache invalidation:**
- Session ends → cache cleared
- Operator publishes new version → next session gets it

### Force Refresh (optional)

If user says "reload skills" or operator pushes update mid-session:

```
capability_skill_reload(capability_id)
```

This is **rare** and not part of MVP.

---

## Error Handling

### Malformed Skill

If registry returns invalid JSON or broken schema:

```json
{
  "error": {
    "code": "SKILL_MALFORMED",
    "message": "Skill 'workouts' has invalid tool schema",
    "details": "Missing required field 'args_schema' in tool 'workout_session_create'"
  }
}
```

**Agent response:**
```
Agent: "There's an issue with the workouts capability.
I've notified the system administrator.

In the meantime, you can log workouts manually in notes,
or I can help with weight tracking and meals."
```

**Logged for operator to fix.**

---

## Operator Workflow (Studio Integration)

### Publishing a New Capability

**Step 1:** Operator creates skill bundle in Studio:
- `capability.json` (metadata + intent triggers)
- `skill.md` (agent instructions)
- `tools.json` (tool contracts)
- `ui_schemas.json` (A2UI definitions)

**Step 2:** Studio validates:
- JSON schemas are valid
- Tool names don't collide with existing capabilities
- UI schema refs are correct
- Skill markdown has required sections

**Step 3:** Operator clicks "Publish"

**Step 4:** Registry stores bundle, indexed by `capability_id`

**Step 5:** Next agent session automatically discovers it via `capability_registry_list`

**No code deploy needed.**

---

## Example: Loading Workouts Skill

### User Message
```
User: "I want to log today's workout"
```

### Agent Reasoning
```
1. Check intent: "log" + "workout" → capability_id = "workouts"
2. Is "workouts" already loaded? No
3. Call capability_skill_load("workouts")
4. Receive skill bundle (tools + docs + UI schemas)
5. Agent now knows:
   - workout_session_create
   - workout_sets_log_batch
   - How to structure a session
   - A2UI panels to use
```

### Agent Response
```
Agent: "Let's log your workout. What did you train today?
(e.g., 'upper push', 'leg day', 'full body')"

[Internally: skill loaded, ready to create session]
```

---

## Integration with Agent Runtime

### Agent Prompt Structure

```
You are an AI personal trainer assistant.

Currently loaded capabilities:
- weights (Weight Tracking)
- workouts (Workout Planning & Logging)

Available tools:
- weight_entry_list
- weight_entry_save_batch
- workout_session_create
- workout_sets_log_batch
- ...

Skill instructions:
[weights skill.md content]
[workouts skill.md content]

User context:
- user_id: user_123
- current_program: "Hypertrophy Block 1"
- readiness_score: 75
```

**Skills are injected into the prompt when loaded.**

---

## Future: Coaching Modes as Skills

**Phase 2 idea:**

Different training philosophies as separate skills:
- `rp_core` (strict RP programming)
- `rp_flexible` (RP with autoregulation)
- `powerlifting_peaking` (Sheiko-style)
- `crossfit_metcons` (conditioning focus)

User selects mode → agent loads that skill → operates within those rules.

**Not in v1** but architecture supports it.

---

## Summary

**Skill loading is:**
- **Discovery-driven** (agent queries registry index)
- **Intent-based** (triggers match user messages)
- **On-demand** (load when needed, not upfront)
- **Multi-skill** (multiple capabilities per session)
- **Operator-friendly** (new skills appear automatically)

**No versioning in v1** — just "latest" per capability.

**Fallback gracefully** — agent explains when capability missing.

This enables the **Studio vision** where operators can publish capabilities without engineering.
