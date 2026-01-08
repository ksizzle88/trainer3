# Multi-Tenancy Architecture

This platform is designed as a **multi-tenant SaaS** from day 1.

## Core Principle

Every user's data is isolated. The system enforces:
- User identity verification
- Tenant-scoped data access
- No cross-user data leakage

## Data Isolation

### User ID in All Tables

Every data table includes `user_id`:

```sql
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,  -- ← REQUIRED
  measured_at TIMESTAMPTZ NOT NULL,
  weight_lbs NUMERIC(6,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weight_entries_user ON weight_entries(user_id);
```

**Rationale:**
- Simplifies queries (just filter by `user_id`)
- Enables per-user data export/deletion (GDPR)
- Standard multi-tenant pattern

### Composite Uniqueness Constraints

For data that should be unique per user (not globally):

```sql
-- Example: prevent duplicate weigh-ins at same timestamp for one user
ALTER TABLE weight_entries
  ADD CONSTRAINT unique_user_measured_at
  UNIQUE (user_id, measured_at);
```

## Authentication & Authorization

### Auth Flow

1. **User logs in** → receives JWT token
2. **JWT contains** `user_id` + `email` + `roles` (optional)
3. **Every API request** includes JWT in `Authorization: Bearer <token>` header
4. **API Executor extracts** `user_id` from JWT
5. **All tool calls** automatically scoped to that `user_id`

### API Executor Responsibilities

The API Executor is the **authoritative boundary** that enforces user isolation:

```python
# Pseudocode
def execute_tool(tool_name, args, jwt):
    user_id = extract_user_id_from_jwt(jwt)

    # Automatically inject user_id into all queries
    if tool_name == "weight_entry_list":
        return db.query(
            "SELECT * FROM weight_entries WHERE user_id = ? LIMIT ?",
            user_id, args['limit']
        )

    if tool_name == "weight_entry_save_batch":
        # Enforce user_id on all rows
        for row in args['rows']:
            row['user_id'] = user_id  # Override any client-provided user_id
        return db.insert_batch("weight_entries", args['rows'])
```

**Key insight:** The agent never sees or specifies `user_id`. The API Executor injects it based on the authenticated session.

## Agent Runtime Context

### User Context Injection

When the Agent Runtime receives a request:
1. API passes `user_id` + `session_context`
2. Agent loads user-specific data (profile, preferences, history)
3. Agent operates within that user's context for the entire session

**The agent never crosses user boundaries.**

### Session Isolation

Each conversation session is scoped to one user:
- Session state includes `user_id`
- Tool calls are automatically filtered
- No way for agent to access other users' data

## Audit Console Context

When displaying pending approvals in Audit mode:

```json
{
  "approval_id": "appr_123",
  "user_id": "user_abc",
  "user_email": "jane@example.com",
  "tool_name": "weight_entry_save_batch",
  "args": {...},
  "timestamp": "2026-01-08T10:30:00Z"
}
```

The Audit Console shows:
- Which user triggered the action
- What they're trying to do
- Full context for approval decision

## Future: Coach-Client Relationships

**Phase 2 (not MVP):**

Allow a **coach** to access **client** data with explicit permission:

```sql
CREATE TABLE coach_client_relationships (
  id UUID PRIMARY KEY,
  coach_user_id UUID NOT NULL,
  client_user_id UUID NOT NULL,
  permission_level TEXT NOT NULL,  -- 'read' | 'write' | 'full'
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
```

**Access pattern:**
- Coach logs in as their own user
- UI shows "Switch to client view" dropdown
- API validates coach has permission for that client
- Subsequent requests scoped to client's `user_id`, but logged with coach's identity

## Data Residency & Compliance

### GDPR / Data Export

Every user can request:
- **Export:** All data where `user_id = X` → JSON/CSV
- **Deletion:** Cascade delete or anonymize all rows with `user_id = X`

### Data Retention Policies

Configure per-user or globally:
- Auto-delete workout logs older than N years
- Anonymize weight entries after account deletion
- Audit log retention (legal compliance)

## Security Best Practices

### SQL Injection Prevention

**Always use parameterized queries:**

```python
# GOOD
db.query("SELECT * FROM weight_entries WHERE user_id = ?", user_id)

# BAD (NEVER DO THIS)
db.query(f"SELECT * FROM weight_entries WHERE user_id = '{user_id}'")
```

### User ID Verification

**Never trust client-provided `user_id`:**

```python
# GOOD
def save_weights(args, jwt):
    user_id = extract_user_id_from_jwt(jwt)  # From auth token
    for row in args['rows']:
        row['user_id'] = user_id  # Enforce server-side
    db.insert_batch("weight_entries", args['rows'])

# BAD
def save_weights(args):
    # Client could pass any user_id! ❌
    db.insert_batch("weight_entries", args['rows'])
```

### Rate Limiting

Prevent abuse with per-user rate limits:
- 100 API requests per minute per user
- 10 tool calls per minute per user
- 1000 weight entries per day per user

## Testing Multi-Tenancy

### Unit Tests

Create test users and verify isolation:

```python
def test_user_isolation():
    user_a = create_test_user("alice")
    user_b = create_test_user("bob")

    # Alice logs weight
    alice_jwt = login(user_a)
    save_weight(187.6, alice_jwt)

    # Bob shouldn't see Alice's weight
    bob_jwt = login(user_b)
    bobs_weights = list_weights(bob_jwt)
    assert len(bobs_weights) == 0
```

### Integration Tests

Simulate concurrent users and verify no cross-contamination:
- 100 users logging concurrently
- Verify each user only sees their own data
- Check for race conditions in DB queries

## Summary

Multi-tenancy is **non-negotiable** for this platform:
- All tables have `user_id`
- API Executor enforces user isolation
- Agent never crosses user boundaries
- Audit trail shows user context
- GDPR-compliant data export/deletion

This architecture scales from 1 user to 1 million users without fundamental changes.
