import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { DiscordService } from '../../../discord/discord.service';
import { LECTURE_STEP_NAMES } from '../../state-machine/lecture.steps';

const LECTURE_CHANNELS = [
  'announcements',
  'general',
  'lectures',
  'qa-help',
] as const;

@Injectable()
export class CreateDiscordChannelsStep extends BaseStep {
  readonly name = LECTURE_STEP_NAMES.CREATE_DISCORD_CHANNELS;

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

    const channels = ctx.course.discordChannels.length > 0
      ? ctx.course.discordChannels
      : [...LECTURE_CHANNELS];

    for (const channelName of channels) {
      const existing = await this.getExternalResource(
        ctx,
        ExternalService.DISCORD,
        'CHANNEL',
        channelName,
      );

      if (existing) {
        continue; // already created
      }

      const channel = await this.discordService.createChannel(
        guildId,
        channelName,
        0, // text channel
        ctx.course.id,
      );

      await this.saveExternalResource(
        ctx,
        ExternalService.DISCORD,
        'CHANNEL',
        channelName,
        channel.id,
      );
    }
  }
}
