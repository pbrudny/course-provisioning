import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscordService } from '../discord/discord.service';
import { ExternalService } from '@prisma/client';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discordService: DiscordService,
    private readonly configService: ConfigService,
  ) {}

  async getCourseInfo(token: string) {
    const course = await this.prisma.course.findFirst({
      where: { onboardingToken: token },
    });

    if (!course) {
      throw new NotFoundException('Onboarding link not found');
    }

    return { courseId: course.id, name: course.name, semester: course.semester };
  }

  async register(
    token: string,
    email: string,
    studentNumber: string,
  ): Promise<{ message: string }> {
    const course = await this.prisma.course.findFirst({
      where: { onboardingToken: token },
    });

    if (!course) {
      throw new NotFoundException('Onboarding link not found');
    }

    const verificationToken = crypto.randomUUID();

    await this.prisma.student.upsert({
      where: { courseId_email: { courseId: course.id, email } },
      create: {
        courseId: course.id,
        email,
        studentNumber,
        verificationToken,
      },
      update: {
        studentNumber,
        verificationToken,
        verifiedAt: null,
        agreedRules: 0,
        onboardingDone: false,
      },
    });

    await this.sendVerificationEmail(email, token, verificationToken);

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  async verify(verificationToken: string) {
    const student = await this.prisma.student.findUnique({
      where: { verificationToken },
      include: { course: true },
    });

    if (!student) {
      throw new NotFoundException('Invalid or expired verification link');
    }

    await this.prisma.student.update({
      where: { id: student.id },
      data: { verifiedAt: new Date(), verificationToken: null },
    });

    return {
      studentId: student.id,
      onboardingToken: student.course.onboardingToken ?? '',
    };
  }

  async getStudentStatus(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { course: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let discordInviteUrl: string | undefined;
    if (student.onboardingDone) {
      discordInviteUrl = await this.getDiscordInviteForCourse(student.course);
    }

    return {
      studentId: student.id,
      agreedRules: student.agreedRules,
      onboardingDone: student.onboardingDone,
      discordInviteUrl,
    };
  }

  async agreeRule(studentId: string, ruleIndex: number): Promise<void> {
    if (ruleIndex < 0 || ruleIndex > 2) {
      throw new BadRequestException('Rule index must be 0, 1, or 2');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.verifiedAt) {
      throw new BadRequestException('Email must be verified before agreeing to rules');
    }

    const newAgreedRules = student.agreedRules | (1 << ruleIndex);
    const onboardingDone = newAgreedRules === 7; // all 3 bits set

    await this.prisma.student.update({
      where: { id: studentId },
      data: { agreedRules: newAgreedRules, onboardingDone },
    });
  }

  async getInvite(token: string): Promise<{ inviteUrl: string }> {
    const course = await this.prisma.course.findFirst({
      where: { onboardingToken: token },
    });

    if (!course) {
      throw new NotFoundException('Onboarding link not found');
    }

    const inviteUrl = await this.getDiscordInviteForCourse(course);
    return { inviteUrl };
  }

  private async getDiscordInviteForCourse(course: {
    id: string;
    discordGuildId: string | null;
  }): Promise<string> {
    // Check cached invite in ExternalResource
    const cached = await this.prisma.externalResource.findFirst({
      where: {
        courseId: course.id,
        service: ExternalService.DISCORD,
        resourceType: 'INVITE',
        resourceKey: 'onboarding',
      },
    });

    if (cached) {
      return `https://discord.gg/${cached.externalId}`;
    }

    // Find first Discord channel ID for the course
    const channelResource = await this.prisma.externalResource.findFirst({
      where: {
        courseId: course.id,
        service: ExternalService.DISCORD,
        resourceType: 'CHANNEL',
      },
    });

    if (!channelResource) {
      this.logger.warn(`No Discord channel found for course ${course.id}`);
      if (course.discordGuildId) {
        return `https://discord.com/channels/${course.discordGuildId}`;
      }
      throw new NotFoundException('No Discord channel found for this course');
    }

    const invite = await this.discordService.createInvite(
      channelResource.externalId,
      course.id,
    );

    // Cache the invite code
    await this.prisma.externalResource.create({
      data: {
        courseId: course.id,
        service: ExternalService.DISCORD,
        resourceType: 'INVITE',
        resourceKey: 'onboarding',
        externalId: invite.code,
      },
    });

    return invite.url;
  }

  private async sendVerificationEmail(
    email: string,
    onboardingToken: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const verifyLink = `${frontendUrl}/onboard/${onboardingToken}/verify?v=${verificationToken}`;

    const smtpHost = this.configService.get<string>('mail.host');

    if (!smtpHost) {
      this.logger.warn(
        `SMTP not configured — skipping email. Verify link: ${verifyLink}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });

    await transporter.sendMail({
      from: this.configService.get<string>('mail.from'),
      to: email,
      subject: 'Verify your course registration',
      html: `
        <p>Hello,</p>
        <p>Please verify your email address to complete your course registration:</p>
        <p><a href="${verifyLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Verify my email</a></p>
        <p>Or copy this link: ${verifyLink}</p>
        <p>This link expires after use.</p>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }
}
