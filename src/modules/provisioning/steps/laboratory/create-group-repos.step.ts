import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LABORATORY_STEP_NAMES } from '../../state-machine/laboratory.steps';

@Injectable()
export class CreateGroupReposStep extends BaseStep {
  readonly name = LABORATORY_STEP_NAMES.CREATE_GROUP_REPOS;

  constructor(private readonly githubService: GithubService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    for (const group of ctx.course.labGroups) {
      const existing = await this.getExternalResource(
        ctx,
        ExternalService.GITHUB,
        'REPO',
        `group-${group.number}`,
        group.id,
      );

      if (existing) {
        continue;
      }

      const repoName = group.githubRepoName ?? this.buildRepoName(
        ctx.course.name,
        ctx.course.semester,
        group.number,
      );

      const repo = await this.githubService.createRepo(
        repoName,
        ctx.course.id,
      );

      await this.saveExternalResource(
        ctx,
        ExternalService.GITHUB,
        'REPO',
        `group-${group.number}`,
        String(repo.id),
        group.id,
      );

      await this.saveExternalResource(
        ctx,
        ExternalService.GITHUB,
        'REPO_NAME',
        `group-${group.number}`,
        repo.name,
        group.id,
      );
    }
  }

  private buildRepoName(
    courseName: string,
    semester: string,
    groupNumber: number,
  ): string {
    const slug = courseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const sem = semester.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${slug}-${sem}-group-${groupNumber}`;
  }
}
