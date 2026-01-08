import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';
import { ToolExecutor } from '../tools/tool-executor';
import { CapabilityRegistry } from '../capabilities/capability-registry';

const router = express.Router();

const capabilityRegistry = new CapabilityRegistry();
const toolExecutor = new ToolExecutor(capabilityRegistry);

// List pending approvals
router.get('/pending', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const approvals = await prisma.approval.findMany({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      approvals: approvals.map((a) => ({
        id: a.id,
        tool_name: a.toolName,
        tool_args: a.toolArgs,
        preview: a.preview,
        created_at: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Approve an action
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const approval = await prisma.approval.findFirst({
      where: { id, userId, status: 'pending' },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    // Update approval status
    await prisma.approval.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // Execute the tool
    const result = await toolExecutor.executeApprovedTool(id);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
});

// Deny an action
router.post('/:id/deny', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const approval = await prisma.approval.findFirst({
      where: { id, userId, status: 'pending' },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    await prisma.approval.update({
      where: { id },
      data: { status: 'denied' },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as approvalsRouter };
