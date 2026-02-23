import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterStudentDto {
  @ApiProperty({ example: 'nursultan.rakhmatov@akademiata.edu.pl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '35656' })
  @IsString()
  @IsNotEmpty()
  studentNumber!: string;
}

export class VerifyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationToken!: string;
}

export class StudentStatusDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  agreedRules!: number;

  @ApiProperty()
  onboardingDone!: boolean;

  @ApiProperty({ required: false })
  discordInviteUrl?: string;
}

export class CourseInfoDto {
  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  semester!: string;
}

export class VerifyResponseDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  onboardingToken!: string;
}
