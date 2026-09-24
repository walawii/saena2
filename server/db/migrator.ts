import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { getDatabasePool, isDatabaseConfigured } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(customClient?: pg.PoolClient | pg.Pool): Promise<{ executed: string[]; skipped: string[] }> {
  if (!customClient && !isDatabaseConfigured()) {
    console.warn('[Migrator] Skipping migrations: PostgreSQL DATABASE_URL is not configured.');
    return { executed: [], skipped: ['DATABASE_NOT_CONFIGURED'] };
  }

  const runner = customClient || getDatabasePool();

  // Create migrations tracker table
  await runner.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return { executed: [], skipped: [] };
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const executed: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const existing = await runner.query(
      'SELECT id FROM schema_migrations WHERE migration_name = $1',
      [file]
    );

    if (existing.rows.length > 0) {
      skipped.push(file);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`[Migrator] Applying migration: ${file}...`);
    await runner.query(sql);
    await runner.query(
      'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
      [file]
    );
    executed.push(file);
    console.log(`[Migrator] Successfully applied: ${file}`);
  }

  return { executed, skipped };
}

// Allow standalone execution via CLI (e.g., npm run db:migrate)
if (process.argv[1] && (process.argv[1].endsWith('migrator.ts') || process.argv[1].endsWith('migrator.js'))) {
  runMigrations()
    .then((result) => {
      console.log('[Migrator] Execution finished:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrator] Fatal error during migration:', err);
      process.exit(1);
    });
}

