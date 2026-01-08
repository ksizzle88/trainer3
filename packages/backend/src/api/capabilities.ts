import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { CapabilityRegistry } from '../capabilities/capability-registry';

const router = express.Router();
const capabilityRegistry = new CapabilityRegistry();

// List all available capabilities
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const capabilities = await capabilityRegistry.listCapabilities();

    res.json({
      capabilities: capabilities.map((cap) => ({
        capability_id: cap.capability_id,
        version: cap.version,
        title: cap.title,
        description: cap.description,
        tools_count: cap.tools.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get specific capability details
router.get('/:capabilityId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { capabilityId } = req.params;
    const capability = await capabilityRegistry.getCapability(capabilityId);

    if (!capability) {
      return res.status(404).json({ error: 'Capability not found' });
    }

    res.json(capability);
  } catch (error) {
    next(error);
  }
});

// Get skill documentation
router.get('/:capabilityId/skill-docs', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { capabilityId } = req.params;
    const docs = await capabilityRegistry.getSkillDocs(capabilityId);

    if (!docs) {
      return res.status(404).json({ error: 'Skill docs not found' });
    }

    res.json({ docs });
  } catch (error) {
    next(error);
  }
});

export { router as capabilitiesRouter };
