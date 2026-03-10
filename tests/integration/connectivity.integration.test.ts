/**
 * Integration test: connectivity to Postgres and Redis.
 * Requires env: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, REDIS_URL.
 * In CI these are provided by GitHub Actions services.
 */
import pg from 'pg';
import { createClient } from 'redis';

const { Client } = pg;

/** Retry a fn up to 5 times with 3s delay between attempts (CI services may need a moment to accept connections). */
async function withRetry<T>(fn: () => Promise<T>, _label: string): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < 5; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < 4) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastErr;
}

describe('Connectivity (integration)', () => {
  const postgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'test',
  };

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  beforeAll(async () => {
    await new Promise((r) => setTimeout(r, 10000));
  }, 15000);

  it('connects to Postgres', async () => {
    await withRetry(async () => {
      const client = new Client(postgresConfig);
      try {
        await client.connect();
        const res = await client.query('SELECT 1 as ok');
        expect(res.rows[0].ok).toBe(1);
        return;
      } finally {
        await client.end();
      }
    }, 'Postgres');
  });

  it('connects to Redis', async () => {
    await withRetry(async () => {
      const client = createClient({ url: redisUrl });
      try {
        await client.connect();
        const pong = await client.ping();
        expect(pong).toBe('PONG');
      } finally {
        await client.quit();
      }
    }, 'Redis');
  });
});
