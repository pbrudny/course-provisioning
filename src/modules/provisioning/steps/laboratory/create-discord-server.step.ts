import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

@Injectable()
export class LabCreateDiscordServerStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.CREATE_DISCORD_SERVER;

  async execute(ctx: StepContext): Promise<void> {
    const existing = await this.getExternalResource(
      ctx,
      ExternalService.DISCORD,
      'GUILD',
      'main',
    );

    if (existing) {
      return;
    }

    if (!ctx.course.discordGuildId) {
      throw new Error(`Course ${ctx.course.id} has no discordGuildId configured`);
    }

    await this.saveExternalResource(
      ctx,
      ExternalService.DISCORD,
      'GUILD',
      'main',
      ctx.course.discordGuildId,
    );
  }
}
