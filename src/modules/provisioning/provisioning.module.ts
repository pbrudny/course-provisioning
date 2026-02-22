import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProvisioningProcessor } from './provisioning.processor';
import { DiscordModule } from '../discord/discord.module';
import { GithubModule } from '../github/github.module';
import { PROVISIONING_QUEUE } from '../courses/courses.service';

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

const STEP_PROVIDERS = [
  // Lecture
  CreateDiscordServerStep,
  CreateDiscordChannelsStep,
  CreateGithubRepoStep,
  ApplyBranchProtectionStep,
  SeedGithubContentStep,
  // Laboratory
  LabCreateDiscordServerStep,
  CreateGroupRolesStep,
  CreateGroupChannelsStep,
  CreateGroupReposStep,
  ApplyGroupBranchProtectionsStep,
  SeedGroupContentStep,
];

@Module({
  imports: [
    BullModule.registerQueue({ name: PROVISIONING_QUEUE }),
    DiscordModule,
    GithubModule,
  ],
  providers: [ProvisioningProcessor, ...STEP_PROVIDERS],
})
export class ProvisioningModule {}
