process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../../auth/auth.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountsModule } from '../../accounts.module';

async function registerAndLogin(
  app: INestApplication,
  email: string,
): Promise<{ accessToken: string }> {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'correct-password' });
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'correct-password' });
  return { accessToken: loginResponse.body.accessToken as string };
}

describe('Accounts HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, AccountsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  // Full-table cleanup is safe here only because integration specs run
  // serially (`jest --runInBand`, see apps/api/package.json).
  afterEach(async () => {
    await prisma.account.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('protected route access', () => {
    it('rejects requests with no token', async () => {
      const response = await request(app.getHttpServer()).get('/accounts');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /accounts', () => {
    it('creates an account owned by the authenticated user', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-a@example.com');

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Main Checking', type: 'bank' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Main Checking');
      expect(response.body.type).toBe('bank');
      expect(typeof response.body.id).toBe('string');
    });

    it('rejects an invalid account type with a validation error', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-invalid@example.com');

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Weird', type: 'crypto_wallet' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /accounts', () => {
    it('lists only accounts owned by the authenticated user', async () => {
      const ownerA = await registerAndLogin(app, 'list-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'list-owner-b@example.com');
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ name: "A's account", type: 'bank' });
      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ name: "B's account", type: 'cash' });

      const response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("A's account");
    });
  });

  describe('cross-user access (ownership isolation)', () => {
    it("returns 404 when a user requests another user's account by id", async () => {
      const ownerA = await registerAndLogin(app, 'cross-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'cross-owner-b@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ name: "A's private account", type: 'bank' });
      const accountId = createResponse.body.id as string;

      const getResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(getResponse.status).toBe(404);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ name: 'Hijacked' });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(deleteResponse.status).toBe(404);

      // the account must be completely untouched by owner B's attempts
      const stillThere = await prisma.account.findUnique({ where: { id: accountId } });
      expect(stillThere?.name).toBe("A's private account");
    });
  });

  describe('GET /accounts/:id', () => {
    it("returns the authenticated user's own account", async () => {
      const owner = await registerAndLogin(app, 'get-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'My Account', type: 'cash' });

      const response = await request(app.getHttpServer())
        .get(`/accounts/${createResponse.body.id as string}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('My Account');
    });

    it('returns 404 for an id that does not exist at all', async () => {
      const owner = await registerAndLogin(app, 'get-missing-owner@example.com');

      const response = await request(app.getHttpServer())
        .get('/accounts/does-not-exist')
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /accounts/:id', () => {
    it("updates the authenticated user's own account", async () => {
      const owner = await registerAndLogin(app, 'update-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'Old Name', type: 'bank' });

      const response = await request(app.getHttpServer())
        .patch(`/accounts/${createResponse.body.id as string}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.type).toBe('bank');
    });
  });

  describe('DELETE /accounts/:id', () => {
    it("deletes the authenticated user's own account", async () => {
      const owner = await registerAndLogin(app, 'delete-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'To Delete', type: 'cash' });
      const accountId = createResponse.body.id as string;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
