import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
export const db = drizzle({ client: pool, schema });
