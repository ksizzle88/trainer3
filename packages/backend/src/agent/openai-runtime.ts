import OpenAI from 'openai';
import { AgentResponse, A2UIView } from '@trainer3/shared';
import { ToolExecutor } from '../tools/tool-executor';
import { CapabilityRegistry } from '../capabilities/capability-registry';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class OpenAIAgentRuntime {
  constructor(
    private toolExecutor: ToolExecutor,
    private capabilityRegistry: CapabilityRegistry
  ) {}

  async processMessage(
    userId: string,
    userMessage: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    try {
      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      // Get available tools
      const tools = await this.getToolDefinitions();

      // Call OpenAI with function calling
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: 'auto',
      });

      const responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        return await this.handleToolCalls(
          userId,
          responseMessage.tool_calls,
          messages,
          responseMessage
        );
      }

      // Regular text response
      return {
        message: responseMessage.content || '',
      };
    } catch (error) {
      console.error('Agent error:', error);
      throw error;
    }
  }

  private async handleToolCalls(
    userId: string,
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[],
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    assistantMessage: OpenAI.Chat.ChatCompletionMessage
  ): Promise<AgentResponse> {
    // Add assistant message with tool calls
    messages.push(assistantMessage);

    // Execute each tool call
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      const result = await this.toolExecutor.executeTool(userId, functionName, args);

      // Add tool result to messages
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // Get final response from agent
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
    });

    const finalMessage = finalCompletion.choices[0].message;

    // Parse if response contains A2UI view
    const view = this.extractA2UIView(finalMessage.content || '');

    return {
      message: finalMessage.content || '',
      view,
    };
  }

  private getSystemPrompt(): string {
    return `You are an AI personal trainer assistant for Trainer3.

Your job is to help users track their fitness data, plan workouts, and achieve their goals.

**Available capabilities:**
- Weight tracking: Users can log their weight entries, view history, and track progress.

**When a user wants to log data:**
1. Use the available tools to read/write data
2. ALWAYS generate an A2UI view for confirmation before writing
3. Present data in table_editor format for batch operations
4. Present data in form format for single entries

**A2UI Response Format:**
When presenting forms or tables, respond with JSON in this format:
\`\`\`json
{
  "kind": "a2ui.v1",
  "view_id": "view_<unique_id>",
  "title": "<title>",
  "tree": {
    "type": "screen",
    "title": "<title>",
    "children": [/* components */]
  }
}
\`\`\`

**Important:**
- Be conversational and encouraging
- Always confirm before writing data
- Provide context and explanations
- Ask clarifying questions when needed`;
  }

  private async getToolDefinitions(): Promise<OpenAI.Chat.ChatCompletionTool[]> {
    const capabilities = await this.capabilityRegistry.listCapabilities();
    const tools: OpenAI.Chat.ChatCompletionTool[] = [];

    for (const capability of capabilities) {
      for (const tool of capability.definition.tools) {
        tools.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.args_schema,
          },
        });
      }
    }

    return tools;
  }

  private extractA2UIView(content: string): A2UIView | undefined {
    try {
      // Look for JSON code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) return undefined;

      const parsed = JSON.parse(jsonMatch[1]);

      if (parsed.kind === 'a2ui.v1') {
        return parsed as A2UIView;
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}
