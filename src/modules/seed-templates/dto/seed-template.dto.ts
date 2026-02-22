import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSeedTemplateDto {
  @ApiProperty({ example: 'Event Driven Programming' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ example: 'Accounts checklist and EDP requirements.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '# README\n\nWelcome...' })
  @IsString()
  @IsNotEmpty()
  readme: string;
}

export class UpdateSeedTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readme?: string;
}

export class SeedTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  readme: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
