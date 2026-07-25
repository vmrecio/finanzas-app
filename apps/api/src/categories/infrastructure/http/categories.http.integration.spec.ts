process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../../auth/auth.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { CategoriesModule } from '../../categories.module';

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

describe('Categories HTTP (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, CategoriesModule],
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
      const response = await request(app.getHttpServer()).get('/categories');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /categories', () => {
    it('creates a category owned by the authenticated user', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-a@example.com');

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Groceries', kind: 'expense' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Groceries');
      expect(response.body.kind).toBe('expense');
      expect(typeof response.body.id).toBe('string');
    });

    it('rejects an invalid category kind with a validation error', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-invalid@example.com');

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Weird', kind: 'transfer' });

      expect(response.status).toBe(400);
    });

    it('rejects creating a duplicate name+kind for the same owner', async () => {
      const { accessToken } = await registerAndLogin(app, 'owner-dup@example.com');
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Groceries', kind: 'expense' });

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Groceries', kind: 'expense' });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /categories', () => {
    it('lists only categories owned by the authenticated user', async () => {
      const ownerA = await registerAndLogin(app, 'list-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'list-owner-b@example.com');
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ name: "A's category", kind: 'expense' });
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ name: "B's category", kind: 'income' });

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${ownerA.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("A's category");
    });
  });

  describe('cross-user access (ownership isolation)', () => {
    it("returns 404 when a user requests another user's category by id", async () => {
      const ownerA = await registerAndLogin(app, 'cross-owner-a@example.com');
      const ownerB = await registerAndLogin(app, 'cross-owner-b@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${ownerA.accessToken}`)
        .send({ name: "A's private category", kind: 'expense' });
      const categoryId = createResponse.body.id as string;

      const getResponse = await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(getResponse.status).toBe(404);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`)
        .send({ name: 'Hijacked' });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${ownerB.accessToken}`);
      expect(deleteResponse.status).toBe(404);

      // the category must be completely untouched by owner B's attempts
      const stillThere = await prisma.category.findUnique({ where: { id: categoryId } });
      expect(stillThere?.name).toBe("A's private category");
    });
  });

  describe('GET /categories/:id', () => {
    it("returns the authenticated user's own category", async () => {
      const owner = await registerAndLogin(app, 'get-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'My Category', kind: 'income' });

      const response = await request(app.getHttpServer())
        .get(`/categories/${createResponse.body.id as string}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('My Category');
    });

    it('returns 404 for an id that does not exist at all', async () => {
      const owner = await registerAndLogin(app, 'get-missing-owner@example.com');

      const response = await request(app.getHttpServer())
        .get('/categories/does-not-exist')
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /categories/:id', () => {
    it("updates the authenticated user's own category", async () => {
      const owner = await registerAndLogin(app, 'update-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'Old Name', kind: 'expense' });

      const response = await request(app.getHttpServer())
        .patch(`/categories/${createResponse.body.id as string}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.kind).toBe('expense');
    });
  });

  describe('DELETE /categories/:id', () => {
    it("deletes the authenticated user's own category", async () => {
      const owner = await registerAndLogin(app, 'delete-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'To Delete', kind: 'income' });
      const categoryId = createResponse.body.id as string;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(getResponse.status).toBe(404);
    });

    it('blocks deletion and preserves the category when it is referenced by a transaction', async () => {
      const owner = await registerAndLogin(app, 'delete-blocked-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'In Use', kind: 'expense' });
      const categoryId = createResponse.body.id as string;
      const ownerId = (await prisma.user.findUnique({ where: { email: 'delete-blocked-owner@example.com' } }))!
        .id;
      const accountId = 'delete-blocked-account';
      await prisma.account.create({ data: { id: accountId, userId: ownerId, name: 'Checking', type: 'bank' } });
      await prisma.transaction.create({
        data: {
          id: 'delete-blocked-transaction',
          userId: ownerId,
          accountId,
          categoryId,
          type: 'expense',
          amountCents: 500n,
          occurredOn: new Date('2026-07-01T00:00:00.000Z'),
        },
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(deleteResponse.status).toBe(409);
      expect(await prisma.category.findUnique({ where: { id: categoryId } })).not.toBeNull();
    });

    // Regression test for GitHub issue #17: a category with a budget but
    // zero transactions previously passed the transaction-only guard and
    // then hit the budgets.category_id ON DELETE RESTRICT FK directly,
    // surfacing as a raw 500 instead of a clean 409.
    it('blocks deletion with 409 (not 500) and preserves the category when it is referenced by a budget but has zero transactions', async () => {
      const owner = await registerAndLogin(app, 'delete-blocked-by-budget-owner@example.com');
      const createResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'Budgeted', kind: 'expense' });
      const categoryId = createResponse.body.id as string;
      const ownerId = (
        await prisma.user.findUnique({
          where: { email: 'delete-blocked-by-budget-owner@example.com' },
        })
      )!.id;
      await prisma.budget.create({
        data: {
          id: 'delete-blocked-budget',
          userId: ownerId,
          categoryId,
          periodMonth: '2026-07',
          limitCents: 10_000n,
        },
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(deleteResponse.status).toBe(409);
      expect(await prisma.category.findUnique({ where: { id: categoryId } })).not.toBeNull();
    });
  });
});
