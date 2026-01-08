import { z } from 'zod';

/**
 * Tool Contract
 *
 * Defines how agents interact with the platform's capabilities.
 */

// Tool policy
export const ToolPolicySchema = z.object({
  kind: z.enum(['read', 'write']),
  requires_approval: z.boolean().default(false),
  allowed_roles: z.array(z.string()).optional(),
});

export type ToolPolicy = z.infer<typeof ToolPolicySchema>;

// Tool definition
export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  args_schema: z.any(), // JSON Schema object
  result_schema: z.any(), // JSON Schema object
  policy: ToolPolicySchema,
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// Tool call (from agent)
export const ToolCallSchema = z.object({
  tool_name: z.string(),
  args: z.record(z.any()),
  idempotency_key: z.string().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// Tool result (to agent)
export const ToolResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    data: z.any(),
  }),
  z.object({
    status: z.literal('error'),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    }),
  }),
  z.object({
    status: z.literal('pending_approval'),
    approval_id: z.string(),
    preview: z.any().optional(),
  }),
]);

export type ToolResult = z.infer<typeof ToolResultSchema>;

// Weight entry types (domain-specific)
export const WeightEntrySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  measured_at: z.string().datetime(),
  weight_lbs: z.number().positive(),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type WeightEntry = z.infer<typeof WeightEntrySchema>;

export const WeightEntryUpsertSchema = z.object({
  id: z.string().optional(),
  measured_at: z.string().datetime(),
  weight_lbs: z.number().positive(),
  notes: z.string().optional(),
});

export type WeightEntryUpsert = z.infer<typeof WeightEntryUpsertSchema>;

// Weight tools args
export const WeightEntryListArgsSchema = z.object({
  limit: z.number().default(30),
  cursor: z.string().optional(),
});

export const WeightEntrySaveBatchArgsSchema = z.object({
  rows: z.array(WeightEntryUpsertSchema),
});

export const WeightEntryDeleteBatchArgsSchema = z.object({
  ids: z.array(z.string()),
});

export type WeightEntryListArgs = z.infer<typeof WeightEntryListArgsSchema>;
export type WeightEntrySaveBatchArgs = z.infer<typeof WeightEntrySaveBatchArgsSchema>;
export type WeightEntryDeleteBatchArgs = z.infer<typeof WeightEntryDeleteBatchArgsSchema>;
