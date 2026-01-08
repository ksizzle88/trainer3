import { CapabilityDefinition } from '@trainer3/shared';
import { prisma } from '../db/prisma';
import { weightsCapability } from './weights-capability';

export class CapabilityRegistry {
  private inMemoryCapabilities: Map<string, CapabilityDefinition> = new Map();

  async initialize() {
    // Register built-in capabilities
    await this.registerCapability(weightsCapability);

    console.log('✅ Capability registry initialized');
  }

  async registerCapability(capability: CapabilityDefinition) {
    // Store in memory
    this.inMemoryCapabilities.set(capability.capability_id, capability);

    // Persist to database
    await prisma.capability.upsert({
      where: {
        capabilityId_version: {
          capabilityId: capability.capability_id,
          version: capability.version,
        },
      },
      create: {
        capabilityId: capability.capability_id,
        version: capability.version,
        status: 'published',
        definition: capability as any,
      },
      update: {
        definition: capability as any,
        updatedAt: new Date(),
      },
    });

    console.log(`📦 Registered capability: ${capability.capability_id}`);
  }

  async getCapability(capabilityId: string): Promise<CapabilityDefinition | null> {
    // Try in-memory first
    const inMemory = this.inMemoryCapabilities.get(capabilityId);
    if (inMemory) return inMemory;

    // Fallback to database
    const dbCapability = await prisma.capability.findFirst({
      where: {
        capabilityId,
        status: 'published',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!dbCapability) return null;

    return dbCapability.definition as any as CapabilityDefinition;
  }

  async listCapabilities(): Promise<CapabilityDefinition[]> {
    return Array.from(this.inMemoryCapabilities.values());
  }

  async getSkillDocs(capabilityId: string): Promise<string | null> {
    const capability = await this.getCapability(capabilityId);
    if (!capability?.skill_docs) return null;

    return `
# ${capability.skill_docs.title}

${capability.skill_docs.description}

## When to use
${capability.skill_docs.when_to_use}

## Instructions
${capability.skill_docs.instructions}

${capability.skill_docs.examples?.map(ex => `
### Example: ${ex.scenario}
User: "${ex.user_input}"
Expected: ${ex.expected_behavior}
`).join('\n') || ''}
    `.trim();
  }
}
