# Trainer3 — Unified Platform Specification

This folder contains the **complete specification** for Trainer3, an AI personal trainer platform.

This spec combines:
- **Platform architecture** (capability registry, A2UI, trust boundaries, multi-tenancy)
- **Fitness domain expertise** (RP programming, fatigue modeling, workout tracking)
- **Operator-friendly design** (Studio-ready capability system)

## Core Principles

- **AI coach as a feature**, not the entire product
- **Modular capabilities** that can be added without code deploys
- **Multi-tenant SaaS** from day 1
- **Operator-friendly** (non-technical users can extend the platform via Studio)
- **Safe by default** (audit mode, plan diff approvals, never silent edits)
- **Pragmatic** (CRUD tools, simplified versioning, graceful degradation)

## Reading Order

### Foundation
1. [00-overview/00-vision.md](00-overview/00-vision.md) — What we're building and why

### Product & Users
2. [01-product/00-user-journeys.md](01-product/00-user-journeys.md) — Core user workflows
3. [01-product/01-rp-programming.md](01-product/01-rp-programming.md) — RP training principles

### Platform Architecture
4. [02-platform-architecture/00-system-map.md](02-platform-architecture/00-system-map.md) — Components and trust boundaries
5. [02-platform-architecture/01-multi-tenancy.md](02-platform-architecture/01-multi-tenancy.md) — User isolation and auth

### Capability System
6. [05-capabilities-and-skills/00-capability-registry.md](05-capabilities-and-skills/00-capability-registry.md) — Discovery and versioning
7. [05-capabilities-and-skills/01-skill-bundle-format.md](05-capabilities-and-skills/01-skill-bundle-format.md) — Skill structure
8. [05-capabilities-and-skills/02-skill-loading.md](05-capabilities-and-skills/02-skill-loading.md) — Loading protocol

### User Interface
9. [06-ui-and-a2ui/00-ui-contract.md](06-ui-and-a2ui/00-ui-contract.md) — A2UI base components
10. [06-ui-and-a2ui/01-batch-editor.md](06-ui-and-a2ui/01-batch-editor.md) — Batch editing UX
11. [06-ui-and-a2ui/02-workout-panels.md](06-ui-and-a2ui/02-workout-panels.md) — Workout-specific panels

### Safety & Governance
12. [07-audit-and-approvals/00-coach-audit.md](07-audit-and-approvals/00-coach-audit.md) — Audit mode
13. [07-audit-and-approvals/01-plan-changes.md](07-audit-and-approvals/01-plan-changes.md) — Plan diff UX

### Data Models
14. [04-data-model/00-weights.md](04-data-model/00-weights.md) — Weight tracking (simple example)
15. [04-data-model/01-workouts.md](04-data-model/01-workouts.md) — Workout planning and logging
16. [04-data-model/02-fatigue.md](04-data-model/02-fatigue.md) — Fatigue formulas and readiness

### Contracts
17. [03-contracts/00-event-protocol.md](03-contracts/00-event-protocol.md) — Event messaging
18. [03-contracts/01-tool-contract.md](03-contracts/01-tool-contract.md) — Tool schemas

### Examples
19. [08-examples/00-weights-examples.md](08-examples/00-weights-examples.md) — Weight tracking examples
20. [08-examples/01-workouts-examples.md](08-examples/01-workouts-examples.md) — Workout skill examples

## Glossary (short)

- **Capability**: something the system can do (tools + data model + UI + policy), versioned.
- **Skill**: an instruction + schema bundle the agent can load on-demand for a capability.
- **Tool**: a backend-executed action the agent can call (read/write).
- **A2UI**: a strict JSON UI contract the agent can emit, and the frontend can render.
- **Audit mode**: human-in-the-loop approvals for tool calls and responses.
