import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  LOGS_DIRECTORY: z.string().min(1, 'LOGS_DIRECTORY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

/** Variables de entorno validadas con Zod. */
export const env = parsed.data;
