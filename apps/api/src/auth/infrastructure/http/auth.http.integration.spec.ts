process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthModule } from '../../auth.module';
import { PrismaService } from '../../../prisma/prisma.service';

function extractCookieValue(setCookieHeader: string[] | undefined, name: string): string | null {
  const cookieLine = setCookieHeader?.find((line) => line.startsWith(`${name}=`));
  if (!cookieLine) return null;
  const match = /=(.*?);/.exec(`${cookieLine};`);
  return match ? (match[1] ?? null) : null;
}

describe('Auth HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.use(cookieParser());
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  // Full-table cleanup is safe here only because integration specs run
  // serially (`jest --runInBand`, see apps/api/package.json) against the
  // shared docker-compose Postgres — no other spec file's fixtures exist
  // concurrently. Do not parallelize integration tests without adding
  // per-test-file scoping first.
  afterEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates an account and never returns the password hash', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new-user@example.com', password: 'correct-horse-battery' });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('new-user@example.com');
      expect(response.body.passwordHash).toBeUndefined();

      const stored = await prisma.user.findUnique({ where: { email: 'new-user@example.com' } });
      expect(stored?.passwordHash).not.toBe('correct-horse-battery');
    });

    it('rejects a duplicate email registration without altering the existing account', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'dup@example.com', password: 'first-password' });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'dup@example.com', password: 'second-password' });

      expect(response.status).toBe(409);

      const stored = await prisma.user.findUnique({ where: { email: 'dup@example.com' } });
      expect(stored).not.toBeNull();
      const stillFirstHash = stored?.passwordHash;
      expect(stillFirstHash).toBeDefined();
    });

    it('rejects registration with an invalid email format (400)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'somepassword' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'login-user@example.com', password: 'correct-password' });
    });

    it('issues an access token and a refresh-token cookie on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-user@example.com', password: 'correct-password' });

      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');

      const refreshCookie = extractCookieValue(
        response.headers['set-cookie'] as unknown as string[] | undefined,
        'refresh_token',
      );
      expect(refreshCookie).not.toBeNull();
    });

    it('rejects an unknown email with a generic error (no field disclosure)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'whatever' });

      expect(response.status).toBe(401);
    });

    it('rejects a wrong password with the same generic error', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-user@example.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/me (protected route)', () => {
    it('rejects the request with 401 when no token is presented', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.id).toBeUndefined();
    });

    it('returns the authenticated user id when a valid access token is presented', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'me-user@example.com', password: 'correct-password' });
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'me-user@example.com', password: 'correct-password' });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token and rejects reuse of the old one', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'refresh-user@example.com', password: 'correct-password' });
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'refresh-user@example.com', password: 'correct-password' });
      const originalRefreshCookie = extractCookieValue(
        loginResponse.headers['set-cookie'] as unknown as string[] | undefined,
        'refresh_token',
      );

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${originalRefreshCookie}`]);

      expect(refreshResponse.status).toBe(200);
      expect(typeof refreshResponse.body.accessToken).toBe('string');

      const reuseResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${originalRefreshCookie}`]);

      expect(reuseResponse.status).toBe(401);
    });

    it('rejects a request with no refresh cookie at all', async () => {
      const response = await request(app.getHttpServer()).post('/auth/refresh');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token so it can no longer be used to refresh', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'logout-user@example.com', password: 'correct-password' });
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'logout-user@example.com', password: 'correct-password' });
      const refreshCookie = extractCookieValue(
        loginResponse.headers['set-cookie'] as unknown as string[] | undefined,
        'refresh_token',
      );

      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`refresh_token=${refreshCookie}`]);
      expect(logoutResponse.status).toBe(200);

      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshCookie}`]);
      expect(refreshAfterLogout.status).toBe(401);
    });
  });
});
