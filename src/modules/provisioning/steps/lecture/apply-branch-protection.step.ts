import { Injectable, Logger } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LECTURE_STEP_NAMES } from '../../state-machine/lecture.steps';

@Injectable()
export class ApplyBranchProtectionStep extends BaseStep {
  readonly name = LECTURE_STEP_NAMES.APPLY_BRANCH_PROTECTION;
  private readonly logger = new Logger(ApplyBranchProtectionStep.name);

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

    // Branch protection is idempotent via PUT — safe to call again
    try {
      await this.githubService.applyBranchProtection(
        repoName,
        'main',
        ctx.course.id,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Upgrade to GitHub Pro') || msg.includes('make this repository public')) {
        this.logger.warn(`Branch protection skipped for ${repoName}: requires GitHub Pro or public repo`);
        return;
      }
      throw err;
    }
  }
}
