import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourseType } from '@prisma/client';

export class LabGroupDto {
  @ApiProperty({ example: 'Lab Group A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiPropertyOptional({ example: 'intro-to-cs-2024-spring-group-1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  githubRepoName?: string;

  @ApiPropertyOptional({ example: 'lab-group-1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  discordChannelName?: string;

  @ApiPropertyOptional({ example: 'Lab Group 1 — Alpha' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  discordRoleName?: string;

  @ApiPropertyOptional({ example: '14B' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  room?: string;

  @ApiPropertyOptional({ example: 'Thursday' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  day?: string;

  @ApiPropertyOptional({ example: '8:00-9:40' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  time?: string;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2024-spring' })
  @IsString()
  @IsNotEmpty()
  semester: string;

  @ApiProperty({ enum: CourseType, example: CourseType.LECTURE })
  @IsEnum(CourseType)
  type: CourseType;

  @ApiProperty({ example: '1234567890123456789' })
  @IsString()
  @IsNotEmpty()
  discordGuildId: string;

  @ApiPropertyOptional({ example: 'intro-to-cs-2024-spring' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  githubRepoName?: string;

  @ApiPropertyOptional({ example: ['announcements', 'general', 'lectures', 'qa-help'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  discordChannels?: string[];

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  lectureCount?: number;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  labCount?: number;

  @ApiPropertyOptional({ example: '14B' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lectureRoom?: string;

  @ApiPropertyOptional({ example: 'Thursday' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lectureDay?: string;

  @ApiPropertyOptional({ example: '8:00-9:40' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lectureTime?: string;

  @ApiPropertyOptional({ type: [LabGroupDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabGroupDto)
  labGroups?: LabGroupDto[];
}
