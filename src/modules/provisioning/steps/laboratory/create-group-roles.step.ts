import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { DiscordService } from '../../../discord/discord.service';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

@Injectable()
export class CreateGroupRolesStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.CREATE_GROUP_ROLES;

  constructor(private readonly discordService: DiscordService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    const guildId = await this.getExternalResource(
      ctx,
      ExternalService.DISCORD,
      'GUILD',
      'main',
    );

    if (!guildId) {
      throw new Error(
        `Guild not found for course ${ctx.course.id} — ensure CREATE_DISCORD_SERVER ran first`,
      );
    }

    for (const group of ctx.course.labGroups) {
      const existing = await this.getExternalResource(
        ctx,
        ExternalService.DISCORD,
        'ROLE',
        `group-${group.number}`,
        group.id,
      );

      if (existing) {
        continue;
      }

      const roleName = group.discordRoleName ?? `Lab Group ${group.number} — ${group.name}`;
      const role = await this.discordService.createRole(
        guildId,
        roleName,
        ctx.course.id,
      );

      await this.saveExternalResource(
        ctx,
        ExternalService.DISCORD,
        'ROLE',
        `group-${group.number}`,
        role.id,
        group.id,
      );
    }
  }
}
