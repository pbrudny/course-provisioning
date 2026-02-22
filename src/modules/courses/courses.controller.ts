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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { ProvisioningStatusDto } from './dto/provisioning-status.dto';

@ApiTags('courses')
@ApiHeader({ name: 'x-api-key', required: true, description: 'API Key' })
@UseGuards(ApiKeyGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a course (provisioning must be started separately)' })
  @ApiResponse({ status: 202, type: CourseResponseDto })
  create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  @ApiResponse({ status: 200, type: [CourseResponseDto] })
  findAll(): Promise<CourseResponseDto[]> {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  findOne(@Param('id') id: string): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get provisioning status for a course' })
  @ApiResponse({ status: 200, type: ProvisioningStatusDto })
  getStatus(@Param('id') id: string): Promise<ProvisioningStatusDto> {
    return this.coursesService.getStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course settings (seed template) while PENDING' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course and all its data' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(id);
  }

  @Post(':id/provision')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start provisioning for a pending course' })
  @ApiResponse({ status: 202 })
  startProvisioning(@Param('id') id: string): Promise<{ message: string }> {
    return this.coursesService.startProvisioning(id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry failed provisioning for a course' })
  @ApiResponse({ status: 202 })
  retry(@Param('id') id: string): Promise<{ message: string }> {
    return this.coursesService.retry(id);
  }
}
