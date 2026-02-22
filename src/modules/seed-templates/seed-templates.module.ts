import { Module } from '@nestjs/common';
import { SeedTemplatesService } from './seed-templates.service';
import { SeedTemplatesController } from './seed-templates.controller';

@Module({
  controllers: [SeedTemplatesController],
  providers: [SeedTemplatesService],
  exports: [SeedTemplatesService],
})
export class SeedTemplatesModule {}
