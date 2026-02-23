import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_KEY: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  DISCORD_BOT_TOKEN: Joi.string().required(),
  DISCORD_GUILD_ID: Joi.string().required(),
  GITHUB_TOKEN: Joi.string().required(),
  GITHUB_ORG: Joi.string().required(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
});
