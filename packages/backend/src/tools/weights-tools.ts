import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error-handler';
import { v4 as uuidv4 } from 'uuid';

export class WeightsTools {
  async execute(userId: string, toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'weight_entry_list':
        return await this.listEntries(userId, args);
      case 'weight_entry_save_batch':
        return await this.saveBatch(userId, args);
      case 'weight_entry_delete_batch':
        return await this.deleteBatch(userId, args);
      default:
        throw new AppError(404, 'TOOL_NOT_FOUND', `Unknown weights tool: ${toolName}`);
    }
  }

  private async listEntries(
    userId: string,
    args: { limit?: number; cursor?: string }
  ): Promise<any> {
    const limit = args.limit || 30;

    const entries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { measuredAt: 'desc' },
      take: limit + 1, // Take one extra to determine if there's more
      ...(args.cursor && { cursor: { id: args.cursor }, skip: 1 }),
    });

    const hasMore = entries.length > limit;
    const results = hasMore ? entries.slice(0, limit) : entries;

    return {
      entries: results.map((entry) => ({
        id: entry.id,
        measured_at: entry.measuredAt.toISOString(),
        weight_lbs: parseFloat(entry.weightLbs.toString()),
        notes: entry.notes || '',
      })),
      next_cursor: hasMore ? results[results.length - 1].id : null,
    };
  }

  private async saveBatch(
    userId: string,
    args: { rows: Array<{ id?: string; measured_at: string; weight_lbs: number; notes?: string }> }
  ): Promise<any> {
    const { rows } = args;

    if (!rows || rows.length === 0) {
      throw new AppError(400, 'INVALID_INPUT', 'No rows provided');
    }

    // Validate all rows
    for (const row of rows) {
      if (!row.measured_at) {
        throw new AppError(400, 'INVALID_INPUT', 'measured_at is required');
      }
      if (!row.weight_lbs || row.weight_lbs <= 0) {
        throw new AppError(400, 'INVALID_INPUT', 'weight_lbs must be positive');
      }
    }

    const savedIds: string[] = [];

    for (const row of rows) {
      const data = {
        userId,
        measuredAt: new Date(row.measured_at),
        weightLbs: row.weight_lbs,
        notes: row.notes || null,
      };

      if (row.id) {
        // Update existing
        const updated = await prisma.weightEntry.update({
          where: { id: row.id, userId }, // Ensure user owns the entry
          data,
        });
        savedIds.push(updated.id);
      } else {
        // Create new
        const created = await prisma.weightEntry.create({
          data: {
            id: uuidv4(),
            ...data,
          },
        });
        savedIds.push(created.id);
      }
    }

    return {
      saved: savedIds.length,
      ids: savedIds,
    };
  }

  private async deleteBatch(userId: string, args: { ids: string[] }): Promise<any> {
    const { ids } = args;

    if (!ids || ids.length === 0) {
      throw new AppError(400, 'INVALID_INPUT', 'No IDs provided');
    }

    const result = await prisma.weightEntry.deleteMany({
      where: {
        id: { in: ids },
        userId, // Ensure user owns the entries
      },
    });

    return {
      deleted: result.count,
    };
  }
}
