import { Injectable } from '@nestjs/common';
import { ExternalService } from '@prisma/client';
import { BaseStep, StepContext } from '../base.step';
import { GithubService } from '../../../github/github.service';
import { LECTURE_STEP_NAMES } from '../../state-machine/lecture.steps';

@Injectable()
export class CreateGithubRepoStep extends BaseStep {
  readonly name = LECTURE_STEP_NAMES.CREATE_GITHUB_REPO;

  constructor(private readonly githubService: GithubService) {
    super();
  }

  async execute(ctx: StepContext): Promise<void> {
    const existing = await this.getExternalResource(
      ctx,
      ExternalService.GITHUB,
      'REPO',
      'main',
    );

    if (existing) {
      return; // already created — idempotent
    }

    const repoName = ctx.course.githubRepoName ?? this.buildRepoName(ctx.course.name, ctx.course.semester);
    const repo = await this.githubService.createRepo(repoName, ctx.course.id);

    await this.saveExternalResource(
      ctx,
      ExternalService.GITHUB,
      'REPO',
      'main',
      String(repo.id),
    );

    // Also save the repo name for later steps
    await this.saveExternalResource(
      ctx,
      ExternalService.GITHUB,
      'REPO_NAME',
      'main',
      repo.name,
    );
  }

  private buildRepoName(courseName: string, semester: string): string {
    const slug = courseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const sem = semester.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${slug}-${sem}`;
  }
}
