import { CapabilityDefinition } from '@trainer3/shared';

export const weightsCapability: CapabilityDefinition = {
  capability_id: 'weights',
  version: 'latest',
  title: 'Weight Tracking',
  description: 'Track and manage body weight entries over time',
  tools: [
    {
      name: 'weight_entry_list',
      description: 'List weight entries for the current user, sorted by date (most recent first)',
      args_schema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of entries to return',
            default: 30,
          },
          cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
      },
      result_schema: {
        type: 'object',
        properties: {
          entries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                measured_at: { type: 'string', format: 'date-time' },
                weight_lbs: { type: 'number' },
                notes: { type: 'string' },
              },
            },
          },
          next_cursor: { type: 'string' },
        },
      },
      policy: {
        kind: 'read',
        requires_approval: false,
      },
    },
    {
      name: 'weight_entry_save_batch',
      description: 'Create or update multiple weight entries in a single batch',
      args_schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'If provided, update this entry; otherwise create new',
                },
                measured_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the weight was measured',
                },
                weight_lbs: {
                  type: 'number',
                  description: 'Weight in pounds (must be positive)',
                },
                notes: {
                  type: 'string',
                  description: 'Optional notes about the measurement',
                },
              },
              required: ['measured_at', 'weight_lbs'],
            },
          },
        },
        required: ['rows'],
      },
      result_schema: {
        type: 'object',
        properties: {
          saved: { type: 'number' },
          ids: { type: 'array', items: { type: 'string' } },
        },
      },
      policy: {
        kind: 'write',
        requires_approval: true,
      },
    },
    {
      name: 'weight_entry_delete_batch',
      description: 'Delete multiple weight entries by ID',
      args_schema: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of entry IDs to delete',
          },
        },
        required: ['ids'],
      },
      result_schema: {
        type: 'object',
        properties: {
          deleted: { type: 'number' },
        },
      },
      policy: {
        kind: 'write',
        requires_approval: true,
      },
    },
  ],
  table_cards: [
    {
      table_name: 'weight_entries',
      description: 'User weight measurements over time',
      fields: [
        {
          name: 'measured_at',
          type: 'timestamp',
          description: 'When the weight was measured',
          required: true,
          constraints: 'Unique per user',
        },
        {
          name: 'weight_lbs',
          type: 'numeric(6,2)',
          description: 'Weight in pounds',
          required: true,
          constraints: 'Must be positive',
        },
        {
          name: 'notes',
          type: 'text',
          description: 'Optional notes about the measurement',
          required: false,
        },
      ],
      examples: [
        {
          measured_at: '2026-01-08T12:00:00-05:00',
          weight_lbs: 187.6,
          notes: 'Morning weight',
        },
      ],
    },
  ],
  skill_docs: {
    capability_id: 'weights',
    title: 'Weight Tracking Skill',
    description: 'Help users log and track their body weight over time',
    when_to_use: 'When users mention logging weight, checking weight history, or want to see weight trends',
    instructions: `
**When the user wants to log a new weight:**
1. Extract the weight value and optional timestamp
2. If no timestamp provided, assume current time
3. Call weight_entry_save_batch with the data
4. Present an A2UI form for confirmation

**When the user wants to view history:**
1. Call weight_entry_list
2. Present results as an A2UI table_editor
3. Allow editing/deleting entries

**Weight parsing rules:**
- Accept "lbs", "pounds", "lb" as units
- If only a number given, assume pounds
- Dates without times → use 12:00 PM local time
- Be forgiving with date formats

**Examples:**
- "I weigh 187.6 lbs" → Save with current timestamp
- "Show my weight history" → List entries as table
- "I weighed 185 yesterday morning" → Parse relative date
    `,
    examples: [
      {
        scenario: 'User logs current weight',
        user_input: 'I weigh 187.6 lbs today',
        expected_behavior: 'Call weight_entry_save_batch, show confirmation form',
      },
      {
        scenario: 'User wants to see history',
        user_input: 'Show me my weight log',
        expected_behavior: 'Call weight_entry_list, show table editor',
      },
    ],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
