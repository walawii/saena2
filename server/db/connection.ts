import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface DatabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  errorMessage?: string;
}

let pool: pg.Pool | null = null;
let dbStatus: DatabaseStatus = {
  isConfigured: false,
  isConnected: false,
};

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (url.startsWith('mock:') || url.startsWith('demo:')) return false;
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

export function getDatabasePool(): pg.Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!isDatabaseConfigured() || !connectionString) {
    dbStatus = {
      isConfigured: false,
      isConnected: false,
      errorMessage: 'DATABASE_URL is not configured with a valid postgresql:// connection string'
    };
    throw new Error('DATABASE_URL is not configured with a valid PostgreSQL connection string');
  }

  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: isLocalhost ? false : { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]:', err.message);
    dbStatus.isConnected = false;
    dbStatus.errorMessage = err.message;
  });

  dbStatus.isConfigured = true;
  return pool;
}

/**
 * Executes a query with parameters using the connection pool
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const currentPool = getDatabasePool();
  return currentPool.query<T>(text, params);
}

/**
 * Runs a set of operations inside an isolated database transaction with automatic COMMIT/ROLLBACK
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const currentPool = getDatabasePool();
  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Checks connection status against PostgreSQL
 */
export async function testConnection(): Promise<DatabaseStatus> {
  if (!isDatabaseConfigured()) {
    dbStatus = {
      isConfigured: false,
      isConnected: false,
      errorMessage: 'DATABASE_URL is not configured with a valid PostgreSQL URL.'
    };
    return dbStatus;
  }

  try {
    const currentPool = getDatabasePool();
    const result = await currentPool.query('SELECT NOW() as current_time, current_database() as db_name');
    dbStatus = {
      isConfigured: true,
      isConnected: true
    };
    return dbStatus;
  } catch (err: any) {
    dbStatus = {
      isConfigured: true,
      isConnected: false,
      errorMessage: err.message
    };
    return dbStatus;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return { ...dbStatus };
}
