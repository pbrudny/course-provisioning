import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CourseStatus, CourseType, StepStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PROVISIONING_QUEUE } from '../courses/courses.service';
import { BaseStep, StepContext } from './steps/base.step';

// Lecture steps
import { CreateDiscordServerStep } from './steps/lecture/create-discord-server.step';
import { CreateDiscordChannelsStep } from './steps/lecture/create-discord-channels.step';
import { CreateGithubRepoStep } from './steps/lecture/create-github-repo.step';
import { ApplyBranchProtectionStep } from './steps/lecture/apply-branch-protection.step';
import { SeedGithubContentStep } from './steps/lecture/seed-github-content.step';

// Laboratory steps
import { LabCreateDiscordServerStep } from './steps/laboratory/create-discord-server.step';
import { CreateGroupRolesStep } from './steps/laboratory/create-group-roles.step';
import { CreateGroupChannelsStep } from './steps/laboratory/create-group-channels.step';
import { CreateGroupReposStep } from './steps/laboratory/create-group-repos.step';
import { ApplyGroupBranchProtectionsStep } from './steps/laboratory/apply-group-branch-protections.step';
import { SeedGroupContentStep } from './steps/laboratory/seed-group-content.step';

interface ProvisionJobData {
  courseId: string;
}

@Processor(PROVISIONING_QUEUE)
export class ProvisioningProcessor extends WorkerHost {
  private readonly logger = new Logger(ProvisioningProcessor.name);

  private readonly lectureSteps: BaseStep[];
  private readonly laboratorySteps: BaseStep[];
  private readonly combinedSteps: BaseStep[];

  constructor(
    private readonly prisma: PrismaService,
    // Lecture steps
    private readonly createDiscordServerStep: CreateDiscordServerStep,
    private readonly createDiscordChannelsStep: CreateDiscordChannelsStep,
    private readonly createGithubRepoStep: CreateGithubRepoStep,
    private readonly applyBranchProtectionStep: ApplyBranchProtectionStep,
    private readonly seedGithubContentStep: SeedGithubContentStep,
    // Laboratory steps
    private readonly labCreateDiscordServerStep: LabCreateDiscordServerStep,
    private readonly createGroupRolesStep: CreateGroupRolesStep,
    private readonly createGroupChannelsStep: CreateGroupChannelsStep,
    private readonly createGroupReposStep: CreateGroupReposStep,
    private readonly applyGroupBranchProtectionsStep: ApplyGroupBranchProtectionsStep,
    private readonly seedGroupContentStep: SeedGroupContentStep,
  ) {
    super();

    this.lectureSteps = [
      this.createDiscordServerStep,
      this.createDiscordChannelsStep,
      this.createGithubRepoStep,
      this.applyBranchProtectionStep,
      this.seedGithubContentStep,
    ];

    this.laboratorySteps = [
      this.labCreateDiscordServerStep,
      this.createGroupRolesStep,
      this.createGroupChannelsStep,
      this.createGroupReposStep,
      this.applyGroupBranchProtectionsStep,
      this.seedGroupContentStep,
    ];

    // LABORATORY courses run lecture steps first (shared Discord server + lecture
    // channels + shared GitHub repo), then group-specific steps. The lab
    // CREATE_DISCORD_SERVER is skipped — the lecture step already handles it.
    this.combinedSteps = [
      ...this.lectureSteps,
      this.createGroupRolesStep,
      this.createGroupChannelsStep,
      this.createGroupReposStep,
      this.applyGroupBranchProtectionsStep,
      this.seedGroupContentStep,
    ];
  }

  async process(job: Job<ProvisionJobData>): Promise<void> {
    const { courseId } = job.data;
    this.logger.log(`Processing provisioning job for course ${courseId}`);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { labGroups: true, provisioningSteps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    const steps =
      course.type === CourseType.LECTURE
        ? this.lectureSteps
        : this.combinedSteps;

    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.IN_PROGRESS },
    });

    const ctx: StepContext = { course, prisma: this.prisma };

    for (const step of steps) {
      const stepRecord = course.provisioningSteps.find(
        (s) => s.stepName === step.name,
      );

      if (!stepRecord) {
        throw new Error(
          `Step record not found for ${step.name} on course ${courseId}`,
        );
      }

      if (stepRecord.status === StepStatus.COMPLETED) {
        this.logger.debug(`Skipping completed step ${step.name}`);
        continue;
      }

      this.logger.log(`Executing step ${step.name} for course ${courseId}`);

      await this.prisma.provisioningStep.update({
        where: { id: stepRecord.id },
        data: {
          status: StepStatus.IN_PROGRESS,
          attempts: { increment: 1 },
          startedAt: new Date(),
        },
      });

      try {
        await step.execute(ctx);

        await this.prisma.provisioningStep.update({
          where: { id: stepRecord.id },
          data: {
            status: StepStatus.COMPLETED,
            finishedAt: new Date(),
            errorMsg: null,
          },
        });

        this.logger.log(
          `Step ${step.name} completed for course ${courseId}`,
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        await this.prisma.provisioningStep.update({
          where: { id: stepRecord.id },
          data: {
            status: StepStatus.FAILED,
            finishedAt: new Date(),
            errorMsg,
          },
        });

        await this.prisma.course.update({
          where: { id: courseId },
          data: { status: CourseStatus.FAILED },
        });

        this.logger.error(
          `Step ${step.name} failed for course ${courseId}: ${errorMsg}`,
        );

        // Re-throw so BullMQ handles retry with exponential backoff
        throw err;
      }
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.COMPLETED },
    });

    this.logger.log(
      `Provisioning completed for course ${courseId}`,
    );
  }
}
