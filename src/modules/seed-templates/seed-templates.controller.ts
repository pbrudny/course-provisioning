import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { SeedTemplatesService } from './seed-templates.service';
import {
  CreateSeedTemplateDto,
  SeedTemplateResponseDto,
  UpdateSeedTemplateDto,
} from './dto/seed-template.dto';

@ApiTags('seed-templates')
@ApiHeader({ name: 'x-api-key', required: true, description: 'API Key' })
@UseGuards(ApiKeyGuard)
@Controller('seed-templates')
export class SeedTemplatesController {
  constructor(private readonly service: SeedTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all seed templates' })
  @ApiResponse({ status: 200, type: [SeedTemplateResponseDto] })
  findAll(): Promise<SeedTemplateResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seed template' })
  @ApiResponse({ status: 200, type: SeedTemplateResponseDto })
  findOne(@Param('id') id: string): Promise<SeedTemplateResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a seed template' })
  @ApiResponse({ status: 201, type: SeedTemplateResponseDto })
  create(@Body() dto: CreateSeedTemplateDto): Promise<SeedTemplateResponseDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a seed template' })
  @ApiResponse({ status: 200, type: SeedTemplateResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSeedTemplateDto,
  ): Promise<SeedTemplateResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom seed template' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
