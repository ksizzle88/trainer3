import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { OpenAIAgentRuntime } from '../agent/openai-runtime';
import { ToolExecutor } from '../tools/tool-executor';
import { CapabilityRegistry } from '../capabilities/capability-registry';
import { UIActionSchema } from '@trainer3/shared';

const router = express.Router();

// Initialize runtime (singleton)
const capabilityRegistry = new CapabilityRegistry();
const toolExecutor = new ToolExecutor(capabilityRegistry);
const agentRuntime = new OpenAIAgentRuntime(toolExecutor, capabilityRegistry);

// Initialize capabilities on startup
capabilityRegistry.initialize().catch(console.error);

// Chat endpoint
router.post('/chat', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { message, conversation_history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userId = req.user!.id;

    const response = await agentRuntime.processMessage(
      userId,
      message,
      conversation_history || []
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// UI Action endpoint (handle form submissions, table actions, etc.)
router.post('/action', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const action = UIActionSchema.parse(req.body);
    const userId = req.user!.id;

    // Convert UI action to agent message
    let message = '';

    switch (action.kind) {
      case 'form.submit':
        message = `User submitted form ${action.form_id} with values: ${JSON.stringify(action.values)}`;
        break;
      case 'table.save':
        message = `User saved table ${action.table_id} with rows: ${JSON.stringify(action.rows)}`;
        break;
      case 'table.add_row':
        message = `User wants to add a row to table ${action.table_id}`;
        break;
      case 'table.delete_row':
        message = `User wants to delete row ${action.row_id} from table ${action.table_id}`;
        break;
      case 'button.click':
        message = `User clicked button ${action.button_id}`;
        break;
    }

    const response = await agentRuntime.processMessage(userId, message, []);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as agentRouter };
