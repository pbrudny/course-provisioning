import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
