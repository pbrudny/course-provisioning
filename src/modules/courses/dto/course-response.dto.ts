import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, CourseType } from '@prisma/client';

export class LabGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  number: number;

  @ApiPropertyOptional()
  githubRepoUrl?: string;

  @ApiPropertyOptional()
  room?: string;

  @ApiPropertyOptional()
  day?: string;

  @ApiPropertyOptional()
  time?: string;
}

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  semester: string;

  @ApiProperty({ enum: CourseType })
  type: CourseType;

  @ApiProperty({ enum: CourseStatus })
  status: CourseStatus;

  @ApiPropertyOptional({ type: [LabGroupResponseDto] })
  labGroups?: LabGroupResponseDto[];

  @ApiPropertyOptional()
  githubRepoUrl?: string;

  @ApiPropertyOptional()
  discordGuildId?: string;

  @ApiPropertyOptional()
  lectureCount?: number;

  @ApiPropertyOptional()
  labCount?: number;

  @ApiPropertyOptional()
  lectureRoom?: string;

  @ApiPropertyOptional()
  lectureDay?: string;

  @ApiPropertyOptional()
  lectureTime?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
