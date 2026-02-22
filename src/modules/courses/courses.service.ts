import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { CourseStatus, CourseType, ExternalService, StepStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { ProvisioningStatusDto } from './dto/provisioning-status.dto';
import { LECTURE_STEPS } from '../provisioning/state-machine/lecture.steps';
import { COMBINED_STEPS } from '../provisioning/state-machine/combined.steps';

export const PROVISIONING_QUEUE = 'provisioning';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue(PROVISIONING_QUEUE) private readonly provisioningQueue: Queue,
  ) {}

  async create(dto: CreateCourseDto): Promise<CourseResponseDto> {
    if (dto.type === CourseType.LABORATORY) {
      if (!dto.labGroups || dto.labGroups.length === 0) {
        throw new BadRequestException(
          'Laboratory courses require at least one lab group',
        );
      }
    }

    const steps =
      dto.type === CourseType.LECTURE ? LECTURE_STEPS : COMBINED_STEPS;

    const course = await this.prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          name: dto.name,
          semester: dto.semester,
          type: dto.type,
          status: CourseStatus.PENDING,
          githubRepoName: dto.githubRepoName,
          discordChannels: dto.discordChannels ?? [],
          discordGuildId: dto.discordGuildId,
          lectureCount: dto.lectureCount,
          labCount: dto.labCount,
          lectureRoom: dto.lectureRoom,
          lectureDay: dto.lectureDay,
          lectureTime: dto.lectureTime,
          labGroups:
            dto.labGroups && dto.labGroups.length > 0
              ? {
                  create: dto.labGroups.map((g) => ({
                    name: g.name,
                    number: g.number,
                    githubRepoName: g.githubRepoName,
                    discordChannelName: g.discordChannelName,
                    discordRoleName: g.discordRoleName,
                    room: g.room,
                    day: g.day,
                    time: g.time,
                  })),
                }
              : undefined,
          provisioningSteps: {
            create: steps.map((step, index) => ({
              stepName: step.name,
              stepOrder: index + 1,
              status: StepStatus.PENDING,
            })),
          },
        },
        include: { labGroups: true },
      });
      return created;
    });

    this.logger.log(`Course ${course.id} created (provisioning not started)`);

    return this.mapToResponse(course);
  }

  async startProvisioning(id: string): Promise<{ message: string }> {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    if (course.status !== CourseStatus.PENDING) {
      throw new BadRequestException(
        `Course ${id} is not in PENDING state (current: ${course.status})`,
      );
    }

    const job = await this.provisioningQueue.add(
      'provision',
      { courseId: id },
      {
        jobId: `provision-${id}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.jobExecution.create({
      data: {
        courseId: id,
        bullJobId: job.id ?? `provision-${id}`,
        attempt: 1,
      },
    });

    this.logger.log(`Course ${id} provisioning started`);

    return { message: `Course ${id} provisioning started` };
  }

  async findAll(): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      include: { labGroups: true, externalResources: true },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => this.mapToResponse(c));
  }

  async findOne(id: string): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { labGroups: true, externalResources: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    return this.mapToResponse(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    if (course.status !== CourseStatus.PENDING) {
      throw new BadRequestException(
        `Course ${id} can only be updated in PENDING state (current: ${course.status})`,
      );
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { seedTemplateId: dto.seedTemplateId },
      include: { labGroups: true, externalResources: true },
    });

    return this.mapToResponse(updated);
  }

  async getStatus(id: string): Promise<ProvisioningStatusDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        provisioningSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    return {
      courseId: course.id,
      courseStatus: course.status,
      steps: course.provisioningSteps.map((s) => ({
        stepName: s.stepName,
        stepOrder: s.stepOrder,
        status: s.status,
        attempts: s.attempts,
        errorMsg: s.errorMsg,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
      })),
    };
  }

  async remove(id: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    await this.prisma.$transaction([
      // ExternalResource references both Course and LabGroup — delete first
      this.prisma.externalResource.deleteMany({ where: { courseId: id } }),
      this.prisma.auditLog.deleteMany({ where: { courseId: id } }),
      this.prisma.jobExecution.deleteMany({ where: { courseId: id } }),
      this.prisma.provisioningStep.deleteMany({ where: { courseId: id } }),
      this.prisma.labGroup.deleteMany({ where: { courseId: id } }),
      this.prisma.course.delete({ where: { id } }),
    ]);

    this.logger.log(`Course ${id} deleted`);
  }

  async retry(id: string): Promise<{ message: string }> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { provisioningSteps: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    if (course.status !== CourseStatus.FAILED) {
      throw new BadRequestException(
        `Course ${id} is not in FAILED state (current: ${course.status})`,
      );
    }

    // Reset FAILED steps back to PENDING
    await this.prisma.$transaction([
      this.prisma.provisioningStep.updateMany({
        where: { courseId: id, status: StepStatus.FAILED },
        data: { status: StepStatus.PENDING, errorMsg: null },
      }),
      this.prisma.course.update({
        where: { id },
        data: { status: CourseStatus.RETRYING },
      }),
    ]);

    const jobId = `provision-${id}-retry-${Date.now()}`;
    const job = await this.provisioningQueue.add(
      'provision',
      { courseId: id },
      {
        jobId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    const existingJobs = await this.prisma.jobExecution.count({
      where: { courseId: id },
    });

    await this.prisma.jobExecution.create({
      data: {
        courseId: id,
        bullJobId: job.id ?? jobId,
        attempt: existingJobs + 1,
      },
    });

    this.logger.log(`Course ${id} queued for retry`);

    return { message: `Course ${id} queued for retry` };
  }

  private mapToResponse(
    course: {
      id: string;
      name: string;
      semester: string;
      type: CourseType;
      status: CourseStatus;
      discordGuildId: string | null;
      lectureCount: number | null;
      labCount: number | null;
      lectureRoom: string | null;
      lectureDay: string | null;
      lectureTime: string | null;
      seedTemplateId: string | null;
      createdAt: Date;
      updatedAt: Date;
      labGroups?: Array<{
        id: string;
        name: string;
        number: number;
        room: string | null;
        day: string | null;
        time: string | null;
      }>;
      externalResources?: Array<{
        service: ExternalService;
        resourceType: string;
        resourceKey: string;
        externalId: string;
        labGroupId: string | null;
      }>;
    },
  ): CourseResponseDto {
    const org = this.configService.get<string>('github.org') ?? '';
    const resources = course.externalResources ?? [];

    const lectureRepoResource = resources.find(
      (r) =>
        r.service === ExternalService.GITHUB &&
        r.resourceType === 'REPO_NAME' &&
        r.resourceKey === 'main' &&
        r.labGroupId === null,
    );
    const githubRepoUrl = lectureRepoResource
      ? `https://github.com/${org}/${lectureRepoResource.externalId}`
      : undefined;

    return {
      id: course.id,
      name: course.name,
      semester: course.semester,
      type: course.type,
      status: course.status,
      discordGuildId: course.discordGuildId ?? undefined,
      lectureCount: course.lectureCount ?? undefined,
      labCount: course.labCount ?? undefined,
      lectureRoom: course.lectureRoom ?? undefined,
      lectureDay: course.lectureDay ?? undefined,
      lectureTime: course.lectureTime ?? undefined,
      seedTemplateId: course.seedTemplateId ?? undefined,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      githubRepoUrl,
      labGroups: course.labGroups?.map((g) => {
        const groupRepoResource = resources.find(
          (r) =>
            r.service === ExternalService.GITHUB &&
            r.resourceType === 'REPO_NAME' &&
            r.labGroupId === g.id,
        );
        return {
          id: g.id,
          name: g.name,
          number: g.number,
          githubRepoUrl: groupRepoResource
            ? `https://github.com/${org}/${groupRepoResource.externalId}`
            : undefined,
          room: g.room ?? undefined,
          day: g.day ?? undefined,
          time: g.time ?? undefined,
        };
      }),
    };
  }
}
