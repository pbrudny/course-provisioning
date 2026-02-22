import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CoursesService, PROVISIONING_QUEUE } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [BullModule.registerQueue({ name: PROVISIONING_QUEUE })],
  providers: [CoursesService],
  controllers: [CoursesController],
})
export class CoursesModule {}
