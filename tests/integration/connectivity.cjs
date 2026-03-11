/**
 * Connectivity check for Postgres and Redis. Run with: node tests/integration/connectivity.cjs
 * Uses env: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, REDIS_URL
 */
const { Client } = require('pg');
const { createClient } = require('redis');

const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'test',
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const pgClient = new Client(postgresConfig);
  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT 1 as ok');
    if (res.rows[0].ok !== 1) {
      console.error('Postgres: unexpected result');
      process.exit(1);
    }
    console.log('Postgres: OK');
  } catch (e) {
    console.error('Postgres:', e?.message ?? e);
    process.exit(1);
  } finally {
    await pgClient.end();
  }

  let redisClient;
  try {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      console.error('Redis: unexpected result');
      process.exit(1);
    }
    console.log('Redis: OK');
  } catch (e) {
    console.error('Redis:', e?.message ?? e);
    process.exit(1);
  } finally {
    if (redisClient) await redisClient.quit();
  }

  console.log('Connectivity check passed');
}

main();
