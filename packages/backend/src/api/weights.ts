import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = express.Router();

// Get weight entries
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 30;

    const entries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });

    res.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        measured_at: entry.measuredAt.toISOString(),
        weight_lbs: parseFloat(entry.weightLbs.toString()),
        notes: entry.notes || '',
        created_at: entry.createdAt.toISOString(),
        updated_at: entry.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single weight entry
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const entry = await prisma.weightEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({
      id: entry.id,
      measured_at: entry.measuredAt.toISOString(),
      weight_lbs: parseFloat(entry.weightLbs.toString()),
      notes: entry.notes || '',
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as weightsRouter };
