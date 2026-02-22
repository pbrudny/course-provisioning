import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import { AuditService } from '../audit/audit.service';

export interface DiscordGuild {
  id: string;
  name: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
}

export interface DiscordRole {
  id: string;
  name: string;
}

export interface DiscordInvite {
  code: string;
  url: string;
}

interface PermissionOverwrite {
  id: string;
  type: 0 | 1; // 0 = role, 1 = member
  allow?: string;
  deny?: string;
}

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private rest: REST;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    const token = this.configService.get<string>('discord.botToken');
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }
    this.rest = new REST({ version: '10' }).setToken(token);
  }

  async createGuild(name: string, courseId: string): Promise<DiscordGuild> {
    return this.auditService.withAudit(
      courseId,
      'DISCORD_CREATE_GUILD',
      { name },
      async () => {
        const guild = (await this.rest.post(Routes.guilds(), {
          body: { name, default_message_notifications: 1 },
        })) as { id: string; name: string };
        this.logger.log(`Created Discord guild: ${guild.id} (${guild.name})`);
        return { id: guild.id, name: guild.name };
      },
    );
  }

  async createChannel(
    guildId: string,
    name: string,
    type: 0 | 4,
    courseId: string,
    options: {
      parentId?: string;
      permissionOverwrites?: PermissionOverwrite[];
    } = {},
  ): Promise<DiscordChannel> {
    return this.auditService.withAudit(
      courseId,
      'DISCORD_CREATE_CHANNEL',
      { guildId, name, type },
      async () => {
        const channel = (await this.rest.post(
          Routes.guildChannels(guildId),
          {
            body: {
              name,
              type,
              parent_id: options.parentId,
              permission_overwrites: options.permissionOverwrites,
            },
          },
        )) as { id: string; name: string };
        this.logger.log(`Created Discord channel: ${channel.id} (${channel.name})`);
        return { id: channel.id, name: channel.name };
      },
    );
  }

  async createRole(
    guildId: string,
    name: string,
    courseId: string,
  ): Promise<DiscordRole> {
    return this.auditService.withAudit(
      courseId,
      'DISCORD_CREATE_ROLE',
      { guildId, name },
      async () => {
        const role = (await this.rest.post(Routes.guildRoles(guildId), {
          body: { name, mentionable: false },
        })) as { id: string; name: string };
        this.logger.log(`Created Discord role: ${role.id} (${role.name})`);
        return { id: role.id, name: role.name };
      },
    );
  }

  async setChannelPermissions(
    guildId: string,
    channelId: string,
    overwrites: PermissionOverwrite[],
    courseId: string,
  ): Promise<void> {
    await this.auditService.withAudit(
      courseId,
      'DISCORD_SET_CHANNEL_PERMISSIONS',
      { guildId, channelId, overwrites },
      async () => {
        for (const overwrite of overwrites) {
          await this.rest.put(
            Routes.channelPermission(channelId, overwrite.id),
            {
              body: {
                type: overwrite.type,
                allow: overwrite.allow ?? '0',
                deny: overwrite.deny ?? '0',
              },
            },
          );
        }
        return {};
      },
    );
  }

  async createInvite(
    channelId: string,
    courseId: string,
  ): Promise<DiscordInvite> {
    return this.auditService.withAudit(
      courseId,
      'DISCORD_CREATE_INVITE',
      { channelId },
      async () => {
        const invite = (await this.rest.post(
          Routes.channelInvites(channelId),
          {
            body: { max_age: 0, max_uses: 0, unique: true },
          },
        )) as { code: string };
        const url = `https://discord.gg/${invite.code}`;
        this.logger.log(`Created Discord invite: ${url}`);
        return { code: invite.code, url };
      },
    );
  }
}
