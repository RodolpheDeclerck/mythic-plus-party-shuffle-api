/**
 * Integration test: connectivity to Postgres and Redis.
 * Requires env: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, REDIS_URL.
 * In CI these are provided by GitHub Actions services.
 */
import pg from 'pg';
import { createClient } from 'redis';

const { Client } = pg;

describe('Connectivity (integration)', () => {
  const postgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'test',
  };

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  it('connects to Postgres', async () => {
    const client = new Client(postgresConfig);
    try {
      await client.connect();
      const res = await client.query('SELECT 1 as ok');
      expect(res.rows[0].ok).toBe(1);
    } finally {
      await client.end();
    }
  });

  it('connects to Redis', async () => {
    const client = createClient({ url: redisUrl });
    try {
      await client.connect();
      const pong = await client.ping();
      expect(pong).toBe('PONG');
    } finally {
      await client.quit();
    }
  });
});
