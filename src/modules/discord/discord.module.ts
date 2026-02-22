import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
