import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LECTURE_STEP_NAMES } from '../../state-machine/lecture.steps';

@Injectable()
export class SeedGithubContentStep extends BaseStep {
  readonly name = LECTURE_STEP_NAMES.SEED_GITHUB_CONTENT;

  constructor(private readonly githubService: GithubService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    const repoName = await this.getExternalResource(
      ctx,
      ExternalService.GITHUB,
      'REPO_NAME',
      'main',
    );

    if (!repoName) {
      throw new Error(
        `Repo name not found for course ${ctx.course.id} — ensure CREATE_GITHUB_REPO ran first`,
      );
    }

    // Check if already seeded
    const seeded = await this.getExternalResource(
      ctx,
      ExternalService.GITHUB,
      'SEEDED',
      'main',
    );

    if (seeded) {
      return; // already seeded
    }

    const templateRow = ctx.course.seedTemplateId
      ? await ctx.prisma.seedTemplate.findUnique({ where: { id: ctx.course.seedTemplateId } })
      : null;
    await this.githubService.seedContent(repoName, ctx.course.id, templateRow?.readme);

    await this.saveExternalResource(
      ctx,
      ExternalService.GITHUB,
      'SEEDED',
      'main',
      'true',
    );
  }
}
