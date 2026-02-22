import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { DiscordService } from '../../../discord/discord.service';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

// Discord permission bit flags
const ALLOW_VIEW_CHANNEL = '1024';
const DENY_VIEW_CHANNEL = '1024';

@Injectable()
export class CreateGroupChannelsStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.CREATE_GROUP_CHANNELS;

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
      const roleId = await this.getExternalResource(
        ctx,
        ExternalService.DISCORD,
        'ROLE',
        `group-${group.number}`,
        group.id,
      );

      if (!roleId) {
        throw new Error(
          `Role not found for group ${group.number} — ensure CREATE_GROUP_ROLES ran first`,
        );
      }

      const existing = await this.getExternalResource(
        ctx,
        ExternalService.DISCORD,
        'CHANNEL',
        `group-${group.number}`,
        group.id,
      );

      if (existing) {
        continue;
      }

      const channelName = group.discordChannelName ?? `lab-group-${group.number}`;

      // Create private channel with permission overwrites:
      // - @everyone: deny VIEW_CHANNEL
      // - group role: allow VIEW_CHANNEL
      const channel = await this.discordService.createChannel(
        guildId,
        channelName,
        0, // text
        ctx.course.id,
        {
          permissionOverwrites: [
            {
              id: guildId, // @everyone role has same ID as the guild
              type: 0,
              deny: DENY_VIEW_CHANNEL,
            },
            {
              id: roleId,
              type: 0,
              allow: ALLOW_VIEW_CHANNEL,
            },
          ],
        },
      );

      await this.saveExternalResource(
        ctx,
        ExternalService.DISCORD,
        'CHANNEL',
        `group-${group.number}`,
        channel.id,
        group.id,
      );
    }
  }
}
