import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { LECTURE_STEP_NAMES } from '../../state-machine/lecture.steps';

@Injectable()
export class CreateDiscordServerStep extends BaseStep {
  readonly name = LECTURE_STEP_NAMES.CREATE_DISCORD_SERVER;

  async execute(ctx: StepContext): Promise<void> {
    const existing = await this.getExternalResource(
      ctx,
      ExternalService.DISCORD,
      'GUILD',
      'main',
    );

    if (existing) {
      return; // already recorded — idempotent
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
