import { Injectable, Logger } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

@Injectable()
export class ApplyGroupBranchProtectionsStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.APPLY_GROUP_BRANCH_PROTECTIONS;
  private readonly logger = new Logger(ApplyGroupBranchProtectionsStep.name);

  constructor(private readonly githubService: GithubService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    for (const group of ctx.course.labGroups) {
      const repoName = await this.getExternalResource(
        ctx,
        ExternalService.GITHUB,
        'REPO_NAME',
        `group-${group.number}`,
        group.id,
      );

      if (!repoName) {
        throw new Error(
          `Repo name not found for group ${group.number} — ensure CREATE_GROUP_REPOS ran first`,
        );
      }

      // PUT is idempotent — no need to check if already applied
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
          continue;
        }
        throw err;
      }
    }
  }
}
