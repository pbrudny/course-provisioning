import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import {
  RegisterStudentDto,
  VerifyDto,
  StudentStatusDto,
  CourseInfoDto,
  VerifyResponseDto,
} from './dto/onboarding.dto';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get course info for the onboarding page' })
  getCourseInfo(@Param('token') token: string): Promise<CourseInfoDto> {
    return this.onboardingService.getCourseInfo(token);
  }

  @Post(':token/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register student and send verification email' })
  register(
    @Param('token') token: string,
    @Body() dto: RegisterStudentDto,
  ): Promise<{ message: string }> {
    return this.onboardingService.register(token, dto.email, dto.studentNumber);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify student email' })
  verify(@Body() dto: VerifyDto): Promise<VerifyResponseDto> {
    return this.onboardingService.verify(dto.verificationToken);
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get student onboarding status' })
  getStudentStatus(@Param('id') id: string): Promise<StudentStatusDto> {
    return this.onboardingService.getStudentStatus(id);
  }

  @Post('students/:id/rules/:ruleIndex/agree')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Agree to a rule (ruleIndex: 0, 1, or 2)' })
  agreeRule(
    @Param('id') id: string,
    @Param('ruleIndex', ParseIntPipe) ruleIndex: number,
  ): Promise<void> {
    return this.onboardingService.agreeRule(id, ruleIndex);
  }

  @Post('students/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email to a student' })
  resendVerification(@Param('id') id: string): Promise<{ message: string }> {
    return this.onboardingService.resendVerification(id);
  }

  @Get(':token/invite')
  @ApiOperation({ summary: 'Get Discord invite URL for the course' })
  getInvite(@Param('token') token: string): Promise<{ inviteUrl: string }> {
    return this.onboardingService.getInvite(token);
  }
}
