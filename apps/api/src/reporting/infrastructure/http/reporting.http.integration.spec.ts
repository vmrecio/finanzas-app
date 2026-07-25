process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../../auth/auth.module';
import { PrismaService } from '../../../prisma/prisma.service';
// TransactionsModule transitively imports AccountsModule + CategoriesModule,
// so composing it here (alongside ReportingModule) gives this integration
// test real /accounts, /categories, and /transactions endpoints to build
// fixtures through, exactly like transactions.http.integration.spec.ts does.
import { TransactionsModule } from '../../../transactions/transactions.module';
import { ReportingModule } from '../../reporting.module';

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

async function createTransaction(
  app: INestApplication,
  accessToken: string,
  body: {
    accountId: string;
    categoryId: string;
    type: 'income' | 'expense';
    amountCents: number;
    occurredOn: string;
  },
): Promise<void> {
  await request(app.getHttpServer())
    .post('/transactions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(body);
}

describe('Reporting HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, TransactionsModule, ReportingModule],
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
    it('rejects requests with no token on every report endpoint', async () => {
      const spendByCategory = await request(app.getHttpServer()).get('/reports/spend-by-category');
      const trend = await request(app.getHttpServer()).get('/reports/income-expense-trend');
      const summary = await request(app.getHttpServer()).get('/reports/summary');

      expect(spendByCategory.status).toBe(401);
      expect(trend.status).toBe(401);
      expect(summary.status).toBe(401);
    });
  });

  describe('GET /reports/spend-by-category', () => {
    it("sums expense amounts by category for the requested period, excluding another user's data", async () => {
      const ownerA = await registerAndLogin(app, 'report-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'report-owner-b@example.com');
      const accountA = await createAccount(app, ownerA.accessToken);
      const groceriesA = await createCategory(app, ownerA.accessToken, 'expense', 'Groceries');
      const transportA = await createCategory(app, ownerA.accessToken, 'expense', 'Transport');
      const accountB = await createAccount(app, ownerB.accessToken);
      const groceriesB = await createCategory(app, ownerB.accessToken, 'expense', 'Groceries');

      await createTransaction(app, ownerA.accessToken, {
        accountId: accountA,
        categoryId: groceriesA,
        type: 'expense',
        amountCents: 3000,
        occurredOn: '2026-07-05T00:00:00.000Z',
      });
      await createTransaction(app, ownerA.accessToken, {
        accountId: accountA,
        categoryId: transportA,
        type: 'expense',
        amountCents: 2000,
        occurredOn: '2026-07-10T00:00:00.000Z',
      });
      await createTransaction(app, ownerB.accessToken, {
        accountId: accountB,
        categoryId: groceriesB,
        type: 'expense',
        amountCents: 99999,
        occurredOn: '2026-07-05T00:00:00.000Z',
      });

      const response = await request(app.getHttpServer())
        .get('/reports/spend-by-category')
        .query({ fromDate: '2026-07-01T00:00:00.000Z', toDate: '2026-07-31T23:59:59.999Z' })
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ categoryName: 'Groceries', totalCents: 3000 }),
          expect.objectContaining({ categoryName: 'Transport', totalCents: 2000 }),
        ]),
      );
      expect(response.body).toHaveLength(2);
    });

    it('returns an empty array (not an error) when there is no data in the period', async () => {
      const { accessToken } = await registerAndLogin(app, 'report-empty@example.com');

      const response = await request(app.getHttpServer())
        .get('/reports/spend-by-category')
        .query({ fromDate: '2026-07-01T00:00:00.000Z', toDate: '2026-07-31T23:59:59.999Z' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('rejects a request missing the required date range', async () => {
      const { accessToken } = await registerAndLogin(app, 'report-missing-range@example.com');

      const response = await request(app.getHttpServer())
        .get('/reports/spend-by-category')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /reports/income-expense-trend', () => {
    it("returns one income/expense pair per month in chronological order, excluding another user's data", async () => {
      const ownerA = await registerAndLogin(app, 'trend-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'trend-owner-b@example.com');
      const accountA = await createAccount(app, ownerA.accessToken);
      const salaryA = await createCategory(app, ownerA.accessToken, 'income', 'Salary');
      const groceriesA = await createCategory(app, ownerA.accessToken, 'expense', 'Groceries');
      const accountB = await createAccount(app, ownerB.accessToken);
      const groceriesB = await createCategory(app, ownerB.accessToken, 'expense', 'Groceries');

      await createTransaction(app, ownerA.accessToken, {
        accountId: accountA,
        categoryId: salaryA,
        type: 'income',
        amountCents: 200000,
        occurredOn: '2026-05-01T00:00:00.000Z',
      });
      await createTransaction(app, ownerA.accessToken, {
        accountId: accountA,
        categoryId: groceriesA,
        type: 'expense',
        amountCents: 5000,
        occurredOn: '2026-06-01T00:00:00.000Z',
      });
      await createTransaction(app, ownerA.accessToken, {
        accountId: accountA,
        categoryId: groceriesA,
        type: 'expense',
        amountCents: 8000,
        occurredOn: '2026-07-01T00:00:00.000Z',
      });
      await createTransaction(app, ownerB.accessToken, {
        accountId: accountB,
        categoryId: groceriesB,
        type: 'expense',
        amountCents: 99999,
        occurredOn: '2026-06-01T00:00:00.000Z',
      });

      const response = await request(app.getHttpServer())
        .get('/reports/income-expense-trend')
        .query({ fromDate: '2026-05-01T00:00:00.000Z', toDate: '2026-07-31T23:59:59.999Z' })
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { period: '2026-05', incomeCents: 200000, expenseCents: 0 },
        { period: '2026-06', incomeCents: 0, expenseCents: 5000 },
        { period: '2026-07', incomeCents: 0, expenseCents: 8000 },
      ]);
    });
  });

  describe('GET /reports/summary', () => {
    it('shows the sum of all account balances and the requested period totals', async () => {
      const { accessToken } = await registerAndLogin(app, 'summary-owner@example.com');
      const accountId = await createAccount(app, accessToken);
      const salaryId = await createCategory(app, accessToken, 'income', 'Salary');
      const groceriesId = await createCategory(app, accessToken, 'expense', 'Groceries');
      await createTransaction(app, accessToken, {
        accountId,
        categoryId: salaryId,
        type: 'income',
        amountCents: 200000,
        occurredOn: '2026-07-01T00:00:00.000Z',
      });
      await createTransaction(app, accessToken, {
        accountId,
        categoryId: groceriesId,
        type: 'expense',
        amountCents: 3000,
        occurredOn: '2026-07-05T00:00:00.000Z',
      });

      const response = await request(app.getHttpServer())
        .get('/reports/summary')
        .query({ fromDate: '2026-07-01T00:00:00.000Z', toDate: '2026-07-31T23:59:59.999Z' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalBalanceCents: 197000,
        periodIncomeCents: 200000,
        periodExpenseCents: 3000,
      });
    });

    it('excludes another user\'s accounts and transactions from the summary', async () => {
      const ownerA = await registerAndLogin(app, 'summary-cross-a@example.com');
      const ownerB = await registerAndLogin(app, 'summary-cross-b@example.com');
      const accountB = await createAccount(app, ownerB.accessToken);
      const categoryB = await createCategory(app, ownerB.accessToken, 'income', 'Salary');
      await createTransaction(app, ownerB.accessToken, {
        accountId: accountB,
        categoryId: categoryB,
        type: 'income',
        amountCents: 999999,
        occurredOn: '2026-07-01T00:00:00.000Z',
      });

      const response = await request(app.getHttpServer())
        .get('/reports/summary')
        .query({ fromDate: '2026-07-01T00:00:00.000Z', toDate: '2026-07-31T23:59:59.999Z' })
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalBalanceCents: 0,
        periodIncomeCents: 0,
        periodExpenseCents: 0,
      });
    });
  });
});
