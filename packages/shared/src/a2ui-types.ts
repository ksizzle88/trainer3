import { z } from 'zod';

/**
 * A2UI (Agent-to-UI) Contract
 *
 * Strict, machine-readable UI schema that agents emit and frontends render.
 */

// Base component types
export const A2UIComponentType = z.enum([
  'screen',
  'section',
  'text',
  'form',
  'field.text',
  'field.number',
  'field.datetime',
  'field.select',
  'table_editor',
  'button',
]);

export type A2UIComponentType = z.infer<typeof A2UIComponentType>;

// Field definitions
export const A2UIFieldSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('field.text'),
    name: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
  }),
  z.object({
    type: z.literal('field.number'),
    name: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    defaultValue: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  }),
  z.object({
    type: z.literal('field.datetime'),
    name: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
  }),
  z.object({
    type: z.literal('field.select'),
    name: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    defaultValue: z.string().optional(),
  }),
]);

export type A2UIField = z.infer<typeof A2UIFieldSchema>;

// Form component
export const A2UIFormSchema = z.object({
  type: z.literal('form'),
  id: z.string(),
  fields: z.array(A2UIFieldSchema),
  submit: z.object({
    label: z.string(),
  }),
});

export type A2UIForm = z.infer<typeof A2UIFormSchema>;

// Table editor column definition
export const A2UITableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'datetime', 'select']),
  required: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
});

export type A2UITableColumn = z.infer<typeof A2UITableColumnSchema>;

// Table editor component
export const A2UITableEditorSchema = z.object({
  type: z.literal('table_editor'),
  id: z.string(),
  columns: z.array(A2UITableColumnSchema),
  rows: z.array(z.record(z.any())), // row_id + dynamic fields
  actions: z.array(z.object({
    kind: z.enum(['table.save', 'table.add_row', 'table.delete_row']),
    label: z.string(),
  })),
});

export type A2UITableEditor = z.infer<typeof A2UITableEditorSchema>;

// Text component
export const A2UITextSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
  variant: z.enum(['body', 'heading', 'subheading', 'caption']).optional(),
});

export type A2UIText = z.infer<typeof A2UITextSchema>;

// Button component
export const A2UIButtonSchema = z.object({
  type: z.literal('button'),
  id: z.string(),
  label: z.string(),
  action: z.string(),
  variant: z.enum(['primary', 'secondary', 'danger']).optional(),
});

export type A2UIButton = z.infer<typeof A2UIButtonSchema>;

// Section component
export const A2UISectionSchema = z.object({
  type: z.literal('section'),
  title: z.string().optional(),
  children: z.array(z.any()), // Will be A2UIComponent[]
});

export type A2UISection = z.infer<typeof A2UISectionSchema>;

// Screen component (root)
export const A2UIScreenSchema = z.object({
  type: z.literal('screen'),
  title: z.string(),
  children: z.array(z.any()), // Will be A2UIComponent[]
});

export type A2UIScreen = z.infer<typeof A2UIScreenSchema>;

// Union of all components
export type A2UIComponent =
  | A2UIScreen
  | A2UISection
  | A2UIText
  | A2UIForm
  | A2UITableEditor
  | A2UIButton;

// View envelope
export const A2UIViewSchema = z.object({
  kind: z.literal('a2ui.v1'),
  view_id: z.string(),
  title: z.string(),
  tree: z.any(), // Will be A2UIComponent
});

export type A2UIView = z.infer<typeof A2UIViewSchema>;

// Agent response envelope
export const AgentResponseSchema = z.object({
  message: z.string().optional(),
  view: A2UIViewSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// UI Actions (from user back to agent)
export const UIActionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('form.submit'),
    form_id: z.string(),
    values: z.record(z.any()),
  }),
  z.object({
    kind: z.literal('table.save'),
    table_id: z.string(),
    rows: z.array(z.record(z.any())),
  }),
  z.object({
    kind: z.literal('table.add_row'),
    table_id: z.string(),
  }),
  z.object({
    kind: z.literal('table.delete_row'),
    table_id: z.string(),
    row_id: z.string(),
  }),
  z.object({
    kind: z.literal('button.click'),
    button_id: z.string(),
  }),
]);

export type UIAction = z.infer<typeof UIActionSchema>;
