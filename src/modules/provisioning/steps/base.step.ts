import { Course, LabGroup } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExternalService } from '@prisma/client';

export interface StepContext {
  course: Course & { labGroups: LabGroup[] };
  prisma: PrismaService;
}

export abstract class BaseStep {
  abstract readonly name: string;

  abstract execute(ctx: StepContext): Promise<void>;

  /**
   * Returns the externalId if the resource already exists, or null.
   * Implements read-before-act idempotency.
   *
   * Uses findFirst because the composite unique index uses a nullable
   * labGroupId, and Prisma's generated findUnique where type requires
   * a non-nullable string for that field.
   */
  protected async getExternalResource(
    ctx: StepContext,
    service: ExternalService,
    resourceType: string,
    resourceKey: string,
    labGroupId?: string,
  ): Promise<string | null> {
    const resource = await ctx.prisma.externalResource.findFirst({
      where: {
        courseId: ctx.course.id,
        service,
        resourceType,
        resourceKey,
        labGroupId: labGroupId ?? null,
      },
    });
    return resource?.externalId ?? null;
  }

  /**
   * Persists an external resource ID using upsert for idempotency.
   */
  protected async saveExternalResource(
    ctx: StepContext,
    service: ExternalService,
    resourceType: string,
    resourceKey: string,
    externalId: string,
    labGroupId?: string,
  ): Promise<void> {
    const resolvedLabGroupId = labGroupId ?? null;

    // findFirst to locate existing record (handles nullable labGroupId)
    const existing = await ctx.prisma.externalResource.findFirst({
      where: {
        courseId: ctx.course.id,
        service,
        resourceType,
        resourceKey,
        labGroupId: resolvedLabGroupId,
      },
    });

    if (existing) {
      await ctx.prisma.externalResource.update({
        where: { id: existing.id },
        data: { externalId },
      });
    } else {
      await ctx.prisma.externalResource.create({
        data: {
          courseId: ctx.course.id,
          service,
          resourceType,
          resourceKey,
          externalId,
          labGroupId: resolvedLabGroupId,
        },
      });
    }
  }
}
