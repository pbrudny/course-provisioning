import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, StepStatus } from '@prisma/client';

export class ProvisioningStepStatusDto {
  @ApiProperty()
  stepName: string;

  @ApiProperty()
  stepOrder: number;

  @ApiProperty({ enum: StepStatus })
  status: StepStatus;

  @ApiProperty()
  attempts: number;

  @ApiPropertyOptional()
  errorMsg?: string | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  finishedAt?: Date | null;
}

export class ProvisioningStatusDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty({ enum: CourseStatus })
  courseStatus: CourseStatus;

  @ApiProperty({ type: [ProvisioningStepStatusDto] })
  steps: ProvisioningStepStatusDto[];
}
