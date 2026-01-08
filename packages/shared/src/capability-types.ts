import { z } from 'zod';
import { ToolDefinitionSchema } from './tool-types';

/**
 * Capability Registry
 *
 * Defines versioned capabilities (tools + data + UI + instructions).
 */

// Skill documentation
export const SkillDocumentationSchema = z.object({
  capability_id: z.string(),
  version: z.string().default('latest'),
  title: z.string(),
  description: z.string(),
  when_to_use: z.string(),
  instructions: z.string(),
  examples: z.array(z.object({
    scenario: z.string(),
    user_input: z.string(),
    expected_behavior: z.string(),
  })).optional(),
});

export type SkillDocumentation = z.infer<typeof SkillDocumentationSchema>;

// Table card (concise data model summary)
export const TableCardSchema = z.object({
  table_name: z.string(),
  description: z.string(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
    constraints: z.string().optional(),
  })),
  examples: z.array(z.record(z.any())).optional(),
});

export type TableCard = z.infer<typeof TableCardSchema>;

// Capability definition
export const CapabilityDefinitionSchema = z.object({
  capability_id: z.string(),
  version: z.string().default('latest'),
  title: z.string(),
  description: z.string(),
  tools: z.array(ToolDefinitionSchema),
  table_cards: z.array(TableCardSchema).optional(),
  skill_docs: SkillDocumentationSchema.optional(),
  ui_schemas: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CapabilityDefinition = z.infer<typeof CapabilityDefinitionSchema>;

// Capability registry entry
export const CapabilityRegistryEntrySchema = z.object({
  capability_id: z.string(),
  version: z.string(),
  status: z.enum(['draft', 'published', 'deprecated']),
  definition: CapabilityDefinitionSchema,
});

export type CapabilityRegistryEntry = z.infer<typeof CapabilityRegistryEntrySchema>;
