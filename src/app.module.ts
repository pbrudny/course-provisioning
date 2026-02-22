import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './health/health.module';
import { SeedTemplatesModule } from './modules/seed-templates/seed-templates.module';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuditModule,
    CoursesModule,
    ProvisioningModule,
    SeedTemplatesModule,
    HealthModule,
  ],
})
export class AppModule {}
