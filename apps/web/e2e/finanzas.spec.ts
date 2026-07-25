import { expect, test, type Page } from '@playwright/test';

/**
 * Full-stack E2E happy path (see design.md "Testing Strategy" — Playwright
 * tier): register(A) -> transaction -> dashboard -> budget, then register(B)
 * and confirm B sees none of A's data. Requires apps/web + apps/api +
 * Postgres all running (see README "End-to-end tests").
 */

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

async function registerAndLogIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/accounts$/);
}

test.describe('finanzas MVP happy path', () => {
  test('register -> transaction -> dashboard -> budget, with per-user data isolation', async ({
    page,
  }) => {
    const password = 'correct horse battery staple';
    const userAEmail = uniqueEmail('user-a');
    const userBEmail = uniqueEmail('user-b');

    await test.step('user A registers, logs in, and creates an account', async () => {
      await registerAndLogIn(page, userAEmail, password);

      await page.getByLabel('Name').fill('Main Checking');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('list', { name: 'Accounts' })).toContainText('Main Checking');
    });

    await test.step('user A creates an expense category', async () => {
      await page.goto('/categories');
      await page.getByLabel('Name').fill('Groceries');
      // Kind select already defaults to "expense".
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('list', { name: 'Categories' })).toContainText('Groceries');
    });

    await test.step('user A records a 50€ expense transaction', async () => {
      await page.goto('/transactions');
      await page.getByLabel('Amount (EUR)').fill('50');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('list', { name: 'Transactions' })).toContainText('50,00');
    });

    await test.step("user A's dashboard reflects the expense", async () => {
      await page.goto('/dashboard');
      await expect(page.getByLabel('Summary')).toContainText('50,00');
      await expect(page.getByLabel('Spend by category')).toContainText('Groceries');
      await expect(page.getByLabel('Spend by category')).toContainText('50,00');
    });

    await test.step('user A creates a budget that the expense already exceeds', async () => {
      await page.goto('/budgets');
      await page.getByLabel('Limit (EUR)').fill('30');
      await page.getByRole('button', { name: 'Create' }).click();

      const budgetsList = page.getByRole('list', { name: 'Budgets' });
      await expect(budgetsList).toContainText('Groceries');
      await expect(budgetsList).toContainText('Exceeded');
    });

    await test.step("user B registers and sees none of user A's data", async () => {
      await page.getByRole('button', { name: 'Log out' }).click();
      await expect(page).toHaveURL(/\/login$/);

      await registerAndLogIn(page, userBEmail, password);
      await expect(page.getByText('No accounts yet.')).toBeVisible();

      await page.goto('/dashboard');
      await expect(page.getByText('No spending data for this period yet.')).toBeVisible();
      await expect(page.getByText('No transaction data for this period yet.')).toBeVisible();

      await page.goto('/budgets');
      await expect(page.getByText('No budgets yet.')).toBeVisible();
    });
  });
});
