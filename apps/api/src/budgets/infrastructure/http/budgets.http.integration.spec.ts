process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../../auth/auth.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsModule } from '../../../transactions/transactions.module';
import { BudgetsModule } from '../../budgets.module';

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

async function createExpenseTransaction(
  app: INestApplication,
  accessToken: string,
  accountId: string,
  categoryId: string,
  amountCents: number,
  occurredOn: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post('/transactions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ accountId, categoryId, type: 'expense', amountCents, occurredOn });
}

describe('Budgets HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // TransactionsModule transitively provides AccountsModule + CategoriesModule
    // (needed here so the test can create accounts/transactions via HTTP to
    // exercise the actual-vs-limit aggregation), same composition pattern as
    // transactions.http.integration.spec.ts.
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, TransactionsModule, BudgetsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  // Full-table cleanup is safe here only because integration specs run
  // serially (`jest --runInBand`, see apps/api/package.json). Budgets and
  // transactions must be cleared before accounts/categories/users due to FK
  // constraints.
  afterEach(async () => {
    await prisma.budget.deleteMany();
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
      const response = await request(app.getHttpServer()).get('/budgets');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /budgets', () => {
    it('creates a budget owned by the authenticated user, for their own expense category', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-owner@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });

      expect(response.status).toBe(201);
      expect(response.body.categoryId).toBe(categoryId);
      expect(response.body.periodMonth).toBe('2026-07');
      expect(response.body.limitCents).toBe(50000);
      expect(response.body.actualCents).toBe(0);
      expect(response.body.exceeded).toBe(false);
    });

    it('rejects a duplicate budget for the same category and month with 409', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-dup@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 30000 });

      expect(response.status).toBe(409);
    });

    it('rejects creating a budget for an income category with 400', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-income@example.com');
      const categoryId = await createCategory(app, accessToken, 'income');

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });

      expect(response.status).toBe(400);
    });

    it("rejects creating a budget for another user's category with 404 (cross-owner reference)", async () => {
      const ownerA = await registerAndLogin(app, 'budget-idor-a@example.com');
      const ownerB = await registerAndLogin(app, 'budget-idor-b@example.com');
      const foreignCategoryId = await createCategory(app, ownerB.accessToken, 'expense', "B's category");

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ categoryId: foreignCategoryId, periodMonth: '2026-07', limitCents: 50000 });

      expect(response.status).toBe(404);
    });

    it('rejects a malformed periodMonth with 400', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-badmonth@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-7', limitCents: 50000 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /budgets and /budgets/:id — actual-vs-limit', () => {
    it('reports under-budget when matching expenses are below the limit', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-under@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');
      await createExpenseTransaction(app, accessToken, accountId, categoryId, 30000, '2026-07-05T00:00:00.000Z');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const response = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.actualCents).toBe(30000);
      expect(response.body.limitCents).toBe(50000);
      expect(response.body.exceeded).toBe(false);
    });

    it('reports exceeded when matching expenses are above the limit', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-over@example.com');
      const accountId = await createAccount(app, accessToken);
      const categoryId = await createCategory(app, accessToken, 'expense');
      await createExpenseTransaction(app, accessToken, accountId, categoryId, 60000, '2026-07-05T00:00:00.000Z');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const response = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.actualCents).toBe(60000);
      expect(response.body.exceeded).toBe(true);
    });

    it('reports zero actual and not exceeded with no matching transactions', async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-zero@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const response = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.actualCents).toBe(0);
      expect(response.body.exceeded).toBe(false);
    });

    it("lists only the authenticated user's own budgets", async () => {
      const ownerA = await registerAndLogin(app, 'budget-list-a@example.com');
      const ownerB = await registerAndLogin(app, 'budget-list-b@example.com');
      const categoryA = await createCategory(app, ownerA.accessToken, 'expense');
      const categoryB = await createCategory(app, ownerB.accessToken, 'expense');
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ categoryId: categoryA, periodMonth: '2026-07', limitCents: 50000 });
      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ categoryId: categoryB, periodMonth: '2026-07', limitCents: 20000 });

      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].categoryId).toBe(categoryA);
    });
  });

  describe('cross-user access (ownership isolation)', () => {
    it("returns 404 when a user requests, updates, or deletes another user's budget", async () => {
      const ownerA = await registerAndLogin(app, 'budget-cross-a@example.com');
      const ownerB = await registerAndLogin(app, 'budget-cross-b@example.com');
      const categoryId = await createCategory(app, ownerA.accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const getResponse = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(getResponse.status).toBe(404);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ limitCents: 999 });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(deleteResponse.status).toBe(404);

      const stillThere = await prisma.budget.findUnique({ where: { id: budgetId } });
      expect(stillThere?.limitCents).toBe(50000n);
    });
  });

  describe('PATCH /budgets/:id', () => {
    it("updates the authenticated user's own budget limit", async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-patch@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const response = await request(app.getHttpServer())
        .patch(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ limitCents: 70000 });

      expect(response.status).toBe(200);
      expect(response.body.limitCents).toBe(70000);
    });
  });

  describe('DELETE /budgets/:id', () => {
    it("deletes the authenticated user's own budget", async () => {
      const { accessToken } = await registerAndLogin(app, 'budget-delete@example.com');
      const categoryId = await createCategory(app, accessToken, 'expense');
      const createResponse = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ categoryId, periodMonth: '2026-07', limitCents: 50000 });
      const budgetId = createResponse.body.id as string;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app.getHttpServer())
        .get(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
