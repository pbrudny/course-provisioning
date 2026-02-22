import { Injectable } from '@nestjs/common';
import { AuditResult } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  courseId: string;
  action: string;
  result: AuditResult;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string;
  durationMs: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        courseId: entry.courseId,
        action: entry.action,
        result: entry.result,
        requestPayload: entry.requestPayload as object | undefined,
        responsePayload: entry.responsePayload as object | undefined,
        errorMessage: entry.errorMessage,
        durationMs: entry.durationMs,
      },
    });
  }

  async withAudit<T>(
    courseId: string,
    action: string,
    requestPayload: Record<string, unknown>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      await this.log({
        courseId,
        action,
        result: AuditResult.SUCCESS,
        requestPayload,
        responsePayload: result as Record<string, unknown>,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.log({
        courseId,
        action,
        result: AuditResult.FAILURE,
        requestPayload,
        errorMessage,
        durationMs: Date.now() - start,
      });
      throw err;
    }
  }
}
