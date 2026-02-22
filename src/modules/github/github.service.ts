import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { AuditService } from '../audit/audit.service';
import { getTemplateReadme } from './seed-templates'; // fallback default README

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
}


const SYLLABUS_CONTENT = `# Course Syllabus

## Course Overview

*Syllabus content to be updated by the instructor.*

## Schedule

| Week | Topic |
|------|-------|
| 1    | Introduction |

## Grading

| Component | Weight |
|-----------|--------|
| Assignments | 50% |
| Final Project | 50% |
`;

const CONTRIBUTING_CONTENT = `# Contributing Guide

## Submitting Assignments

1. Create a branch from \`main\`: \`git checkout -b assignment/your-name/assignment-number\`
2. Complete your work
3. Open a Pull Request following the PR template
4. Request a review from your instructor
5. Address review comments
6. Merge after approval

## Code Standards

- Write clear, readable code with meaningful variable names
- Include comments for complex logic
- Test your code before submitting
`;

const PR_TEMPLATE_CONTENT = `## Summary

Brief description of what this PR does.

## Changes

- [ ] Change 1
- [ ] Change 2

## Testing

Describe how you tested your changes.

## Assignment Checklist

- [ ] All requirements met
- [ ] Code is well-commented
- [ ] No linting errors
`;

const ASSIGNMENT_TEMPLATE_CONTENT = `---
name: Assignment Submission
about: Submit a completed assignment
title: "[Assignment N] Your Name"
labels: assignment
---

## Assignment Details

**Assignment Number:**
**Due Date:**

## Description

Brief description of what you implemented.

## How to Run

Steps to run your solution.

## Notes

Any additional notes for the reviewer.
`;

@Injectable()
export class GithubService implements OnModuleInit {
  private readonly logger = new Logger(GithubService.name);
  private octokit: Octokit;
  private org: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    const token = this.configService.get<string>('github.token');
    const org = this.configService.get<string>('github.org');

    if (!token) throw new Error('GITHUB_TOKEN is not configured');
    if (!org) throw new Error('GITHUB_ORG is not configured');

    this.octokit = new Octokit({ auth: token });
    this.org = org;
  }

  async createRepo(repoName: string, courseId: string): Promise<GithubRepo> {
    return this.auditService.withAudit(
      courseId,
      'GITHUB_CREATE_REPO',
      { org: this.org, repoName },
      async () => {
        try {
          const { data } = await this.octokit.repos.createInOrg({
            org: this.org,
            name: repoName,
            private: false,
            auto_init: true,
            description: `Course repository: ${repoName}`,
          });
          this.logger.log(`Created GitHub repo: ${data.full_name}`);
          return {
            id: data.id,
            name: data.name,
            fullName: data.full_name,
            htmlUrl: data.html_url,
            cloneUrl: data.clone_url,
          };
        } catch (err: unknown) {
          // 422 = repository already exists — idempotent
          if (
            typeof err === 'object' &&
            err !== null &&
            'status' in err &&
            (err as { status: number }).status === 422
          ) {
            this.logger.warn(
              `Repo ${repoName} already exists, fetching existing`,
            );
            const { data } = await this.octokit.repos.get({
              owner: this.org,
              repo: repoName,
            });
            return {
              id: data.id,
              name: data.name,
              fullName: data.full_name,
              htmlUrl: data.html_url,
              cloneUrl: data.clone_url,
            };
          }
          throw err;
        }
      },
    );
  }

  async applyBranchProtection(
    repoName: string,
    branch: string,
    courseId: string,
  ): Promise<void> {
    await this.auditService.withAudit(
      courseId,
      'GITHUB_APPLY_BRANCH_PROTECTION',
      { org: this.org, repoName, branch },
      async () => {
        await this.octokit.repos.updateBranchProtection({
          owner: this.org,
          repo: repoName,
          branch,
          required_status_checks: null,
          enforce_admins: false,
          required_pull_request_reviews: {
            required_approving_review_count: 1,
            dismiss_stale_reviews: true,
          },
          restrictions: null,
          allow_force_pushes: false,
          allow_deletions: false,
        });
        this.logger.log(
          `Applied branch protection to ${repoName}:${branch}`,
        );
        return {};
      },
    );
  }

  async seedContent(repoName: string, courseId: string, readmeContent?: string | null): Promise<void> {
    await this.auditService.withAudit(
      courseId,
      'GITHUB_SEED_CONTENT',
      { org: this.org, repoName },
      async () => {
        // Get current HEAD commit SHA
        const { data: ref } = await this.octokit.git.getRef({
          owner: this.org,
          repo: repoName,
          ref: 'heads/main',
        });
        const baseSha = ref.object.sha;

        // Get base tree SHA
        const { data: baseCommit } = await this.octokit.git.getCommit({
          owner: this.org,
          repo: repoName,
          commit_sha: baseSha,
        });
        const baseTreeSha = baseCommit.tree.sha;

        // Create blobs for all files
        const files = [
          { path: 'README.md', content: readmeContent ?? getTemplateReadme(null) },
          { path: 'syllabus.md', content: SYLLABUS_CONTENT },
          { path: 'CONTRIBUTING.md', content: CONTRIBUTING_CONTENT },
          {
            path: '.github/pull_request_template.md',
            content: PR_TEMPLATE_CONTENT,
          },
          {
            path: '.github/ISSUE_TEMPLATE/assignment.md',
            content: ASSIGNMENT_TEMPLATE_CONTENT,
          },
        ];

        const treeItems = await Promise.all(
          files.map(async (file) => {
            const { data: blob } = await this.octokit.git.createBlob({
              owner: this.org,
              repo: repoName,
              content: Buffer.from(file.content).toString('base64'),
              encoding: 'base64',
            });
            return {
              path: file.path,
              mode: '100644' as const,
              type: 'blob' as const,
              sha: blob.sha,
            };
          }),
        );

        // Create tree
        const { data: tree } = await this.octokit.git.createTree({
          owner: this.org,
          repo: repoName,
          base_tree: baseTreeSha,
          tree: treeItems,
        });

        // Create commit
        const { data: commit } = await this.octokit.git.createCommit({
          owner: this.org,
          repo: repoName,
          message: 'chore: seed initial course content',
          tree: tree.sha,
          parents: [baseSha],
        });

        // Update ref
        await this.octokit.git.updateRef({
          owner: this.org,
          repo: repoName,
          ref: 'heads/main',
          sha: commit.sha,
        });

        this.logger.log(`Seeded content in ${repoName}`);
        return { commitSha: commit.sha };
      },
    );
  }
}
