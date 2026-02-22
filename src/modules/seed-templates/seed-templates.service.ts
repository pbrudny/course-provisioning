import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSeedTemplateDto,
  SeedTemplateResponseDto,
  UpdateSeedTemplateDto,
} from './dto/seed-template.dto';
import { SEED_TEMPLATES } from '../github/seed-templates';

@Injectable()
export class SeedTemplatesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Seed default system templates on first boot if the table is empty. */
  async onApplicationBootstrap(): Promise<void> {
    const count = await this.prisma.seedTemplate.count();
    if (count > 0) return;

    this.logger.log('Seeding default templates…');
    for (const t of SEED_TEMPLATES) {
      await this.prisma.seedTemplate.create({
        data: {
          id: t.id,
          label: t.label,
          description: t.description,
          readme: t.readme,
          isSystem: true,
        },
      });
    }
    this.logger.log(`Seeded ${SEED_TEMPLATES.length} default templates`);
  }

  async findAll(): Promise<SeedTemplateResponseDto[]> {
    const rows = await this.prisma.seedTemplate.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map(this.map);
  }

  async findOne(id: string): Promise<SeedTemplateResponseDto> {
    const row = await this.prisma.seedTemplate.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Template ${id} not found`);
    return this.map(row);
  }

  async create(dto: CreateSeedTemplateDto): Promise<SeedTemplateResponseDto> {
    const row = await this.prisma.seedTemplate.create({
      data: {
        label: dto.label,
        description: dto.description,
        readme: dto.readme,
        isSystem: false,
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateSeedTemplateDto): Promise<SeedTemplateResponseDto> {
    const existing = await this.prisma.seedTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);

    const row = await this.prisma.seedTemplate.update({
      where: { id },
      data: {
        label: dto.label,
        description: dto.description,
        readme: dto.readme,
      },
    });
    return this.map(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.seedTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);
    if (existing.isSystem) {
      throw new BadRequestException('System templates cannot be deleted');
    }
    await this.prisma.seedTemplate.delete({ where: { id } });
  }

  /** Returns the raw readme string for use during provisioning. */
  async getReadme(templateId: string | null | undefined): Promise<string | null> {
    if (!templateId) return null;
    const row = await this.prisma.seedTemplate.findUnique({ where: { id: templateId } });
    return row?.readme ?? null;
  }

  private map(row: {
    id: string;
    label: string;
    description: string | null;
    readme: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SeedTemplateResponseDto {
    return {
      id: row.id,
      label: row.label,
      description: row.description ?? undefined,
      readme: row.readme,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
