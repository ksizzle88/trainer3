import { ToolResult } from '@trainer3/shared';
import { CapabilityRegistry } from '../capabilities/capability-registry';
import { WeightsTools } from './weights-tools';
import { AppError } from '../middleware/error-handler';
import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

export class ToolExecutor {
  private weightsTools: WeightsTools;

  constructor(private capabilityRegistry: CapabilityRegistry) {
    this.weightsTools = new WeightsTools();
  }

  async executeTool(
    userId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    try {
      // Find tool definition
      const tool = await this.findToolDefinition(toolName);

      if (!tool) {
        throw new AppError(404, 'TOOL_NOT_FOUND', `Tool ${toolName} not found`);
      }

      // Check if approval required
      if (tool.policy.requires_approval && process.env.ENABLE_AUDIT_MODE === 'true') {
        return await this.createApprovalRequest(userId, toolName, args);
      }

      // Execute the tool
      const result = await this.executeToolDirect(userId, toolName, args);

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);

      if (error instanceof AppError) {
        return {
          status: 'error',
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        };
      }

      return {
        status: 'error',
        error: {
          code: 'EXECUTION_ERROR',
          message: 'Failed to execute tool',
        },
      };
    }
  }

  private async executeToolDirect(
    userId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    // Route to appropriate tool handler
    if (toolName.startsWith('weight_entry_')) {
      return await this.weightsTools.execute(userId, toolName, args);
    }

    throw new AppError(404, 'TOOL_NOT_FOUND', `No handler for tool ${toolName}`);
  }

  private async findToolDefinition(toolName: string) {
    const capabilities = await this.capabilityRegistry.listCapabilities();

    for (const capability of capabilities) {
      const tool = capability.tools.find((t) => t.name === toolName);
      if (tool) return tool;
    }

    return null;
  }

  private async createApprovalRequest(
    userId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    const approval = await prisma.approval.create({
      data: {
        id: uuidv4(),
        userId,
        toolName,
        toolArgs: args,
        status: 'pending',
      },
    });

    return {
      status: 'pending_approval',
      approval_id: approval.id,
      preview: args,
    };
  }

  async executeApprovedTool(approvalId: string): Promise<any> {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.status !== 'approved') {
      throw new AppError(400, 'INVALID_APPROVAL', 'Approval not found or not approved');
    }

    return await this.executeToolDirect(
      approval.userId,
      approval.toolName,
      approval.toolArgs as Record<string, any>
    );
  }
}
