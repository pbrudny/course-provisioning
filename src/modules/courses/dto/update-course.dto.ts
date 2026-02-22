import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'ID of the SeedTemplate to use for GitHub README' })
  @IsOptional()
  @IsString()
  seedTemplateId?: string;
}
