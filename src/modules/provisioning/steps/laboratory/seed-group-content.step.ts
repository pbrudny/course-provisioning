import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

@Injectable()
export class SeedGroupContentStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.SEED_GROUP_CONTENT;

  constructor(private readonly githubService: GithubService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    for (const group of ctx.course.labGroups) {
      const seeded = await this.getExternalResource(
        ctx,
        ExternalService.GITHUB,
        'SEEDED',
        `group-${group.number}`,
        group.id,
      );

      if (seeded) {
        continue;
      }

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

      await this.githubService.seedContent(repoName, ctx.course.id);

      await this.saveExternalResource(
        ctx,
        ExternalService.GITHUB,
        'SEEDED',
        `group-${group.number}`,
        'true',
        group.id,
      );
    }
  }
}
