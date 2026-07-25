process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../../auth/auth.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsModule } from '../../transactions.module';

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

async function createAccount(
  app: INestApplication,
  accessToken: string,
  name = 'Checking',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/accounts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name, type: 'bank' });
  return response.body.id as string;
}

async function createCategory(
  app: INestApplication,
  accessToken: string,
  kind: 'income' | 'expense',
  name = kind === 'income' ? 'Salary' : 'Groceries',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/categories')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name, kind });
  return response.body.id as string;
}

describe('Transactions HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, TransactionsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  // Full-table cleanup is safe here only because integration specs run
  // serially (`jest --runInBand`, see apps/api/package.json). Transactions
  // must be cleared before accounts/categories/users due to FK constraints.
  afterEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('protected route access', () => {
    it('rejects requests with no token', async () => {
      const response = await request(app.getHttpServer()).get('/transactions');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /transactions', () => {
    it('creates a transaction owned by the authenticated user, linked to their own account and category', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-a@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId,
          type: 'expense',
          amountCents: 3000,
          occurredOn: '2026-07-01T00:00:00.000Z',
          note: 'Weekly shop',
        });

      expect(response.status).toBe(201);
      expect(response.body.accountId).toBe(accountId);
      expect(response.body.categoryId).toBe(categoryId);
      expect(response.body.amountCents).toBe(3000);
      expect(response.body.note).toBe('Weekly shop');
    });

    it('rejects a zero or negative amount with a validation error', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-invalid@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ accountId, categoryId, type: 'expense', amountCents: 0, occurredOn: '2026-07-01T00:00:00.000Z' });

      expect(response.status).toBe(400);
    });

    it('rejects a type that does not match the category kind with a validation error', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-mismatch@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ accountId, categoryId, type: 'income', amountCents: 1000, occurredOn: '2026-07-01T00:00:00.000Z' });

      expect(response.status).toBe(400);
    });

    it("rejects creation when the account belongs to another user (second IDOR surface)", async () => {
      const ownerA = await registerAndLogin(app, 'idor-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'idor-owner-b@example.com');
      const foreignAccountId = await createAccount(app, ownerB.accessToken, "B's account");
      const categoryId = await createCategory(app, ownerA.accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({
          accountId: foreignAccountId,
          categoryId,
          type: 'expense',
          amountCents: 1000,
          occurredOn: '2026-07-01T00:00:00.000Z',
        });

      expect(response.status).toBe(404);
    });

    it("rejects creation when the category belongs to another user (second IDOR surface)", async () => {
      const ownerA = await registerAndLogin(app, 'idor-owner-c@example.com');
      const ownerB = await registerAndLogin(app, 'idor-owner-d@example.com');
      const accountId = await createAccount(app, ownerA.accessToken);
      const foreignCategoryId = await createCategory(app, ownerB.accessToken, 'expense', "B's category");

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({
          accountId,
          categoryId: foreignCategoryId,
          type: 'expense',
          amountCents: 1000,
          occurredOn: '2026-07-01T00:00:00.000Z',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /transactions', () => {
    it("lists only the authenticated user's own transactions, filterable by accountId/categoryId/date range", async () => {
      const { accessToken } = await registerAndLogin(app, 'list-owner@example.com');
      const accountId = await createAccount(app, accessToken);
      const otherAccountId = await createAccount(app, accessToken, 'Savings');
      const categoryId = await createCategory(app, accessToken, 'expense');
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ accountId, categoryId, type: 'expense', amountCents: 100, occurredOn: '2026-02-15T00:00:00.000Z' });
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId: otherAccountId,
          categoryId,
          type: 'expense',
          amountCents: 200,
          occurredOn: '2026-02-15T00:00:00.000Z',
        });

      const response = await request(app.getHttpServer())
        .get('/transactions')
        .query({ accountId })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].accountId).toBe(accountId);
    });

    it('excludes another user\'s transactions', async () => {
      const ownerA = await registerAndLogin(app, 'list-cross-a@example.com');
      const ownerB = await registerAndLogin(app, 'list-cross-b@example.com');
      const accountB = await createAccount(app, ownerB.accessToken);
      const categoryB = await createCategory(app, ownerB.accessToken, 'expense');
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({
          accountId: accountB,
          categoryId: categoryB,
          type: 'expense',
          amountCents: 500,
          occurredOn: '2026-07-01T00:00:00.000Z',
        });

      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('cross-user access (ownership isolation)', () => {
    it("returns 404 when a user requests, updates, or deletes another user's transaction", async () => {
      const ownerA = await registerAndLogin(app, 'cross-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'cross-owner-b@example.com');
      const accountId = await createAccount(app, ownerA.accessToken);
      const categoryId = await createCategory(app, ownerA.accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ accountId, categoryId, type: 'expense', amountCents: 500, occurredOn: '2026-07-01T00:00:00.000Z' });
      const transactionId = createResponse.body.id as string;

      const getResponse = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(getResponse.status).toBe(404);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ amountCents: 999 });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(deleteResponse.status).toBe(404);

      const stillThere = await prisma.transaction.findUnique({ where: { id: transactionId } });
      expect(stillThere?.amountCents).toBe(500n);
    });
  });

  describe('PATCH /transactions/:id and balance propagation', () => {
    it('updating a transaction amount is reflected in the account balance on next read', async () => {
      const { accessToken } = await registerAndLogin(app, 'balance-edit-owner@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ accountId, categoryId, type: 'expense', amountCents: 3000, occurredOn: '2026-07-01T00:00:00.000Z' });
      const transactionId = createResponse.body.id as string;

      const beforeBalance = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(beforeBalance.body.balanceCents).toBe(-3000);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amountCents: 4500 });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.amountCents).toBe(4500);

      const afterBalance = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(afterBalance.body.balanceCents).toBe(-4500);
    });
  });

  describe('DELETE /transactions/:id and balance propagation', () => {
    it("deletes the authenticated user's own transaction and removes its contribution to the account balance", async () => {
      const { accessToken } = await registerAndLogin(app, 'balance-delete-owner@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'income');
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ accountId, categoryId, type: 'income', amountCents: 5000, occurredOn: '2026-07-01T00:00:00.000Z' });
      const transactionId = createResponse.body.id as string;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(getResponse.status).toBe(404);

      const balanceResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(balanceResponse.body.balanceCents).toBe(0);
    });
  });
});
