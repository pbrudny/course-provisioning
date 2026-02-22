import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { PROVISIONING_QUEUE } from '../modules/courses/courses.service';

@Module({
  imports: [
    TerminusModule,
    BullModule.registerQueue({ name: PROVISIONING_QUEUE }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
