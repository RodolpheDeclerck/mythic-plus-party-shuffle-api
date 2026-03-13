/**
 * Integration test: GET /api/version.
 * Uses supertest against a minimal Express app that only mounts version routes
 * (avoids loading full app and ESM-only deps like lodash-es in Jest).
 */
import express from 'express';
import request from 'supertest';
import versionRoutes from '../../src/modules/version/presentation/routes/version.routes.js';

const app = express();
app.use(express.json());
app.use('/api', versionRoutes);

describe('Version API (integration)', () => {
  it('GET /api/version returns 200 and { version: string }', async () => {
    const res = await request(app).get('/api/version').expect(200);

    expect(res.body).toHaveProperty('version');
    expect(typeof res.body.version).toBe('string');
    expect(res.body.version.length).toBeGreaterThan(0);
  });

  it('GET /api/version returns semantic version format', async () => {
    const res = await request(app).get('/api/version').expect(200);

    // e.g. 1.0.0 or 1.0.0-alpha
    const semverLike = /^\d+\.\d+\.\d+([.-][a-zA-Z0-9.-]+)?$/;
    expect(res.body.version).toMatch(semverLike);
  });
});
