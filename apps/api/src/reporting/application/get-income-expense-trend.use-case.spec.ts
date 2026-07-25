import { FakeReporting } from './test-fakes/fake-reporting';
import { GetIncomeExpenseTrendUseCase } from './get-income-expense-trend.use-case';

describe('GetIncomeExpenseTrendUseCase', () => {
  function setup(): { useCase: GetIncomeExpenseTrendUseCase; reporting: FakeReporting } {
    const reporting = new FakeReporting();
    const useCase = new GetIncomeExpenseTrendUseCase(reporting);
    return { useCase, reporting };
  }

  it('delegates to the reporting port with the owner and date range, in chronological order', async () => {
    const { useCase, reporting } = setup();
    const fromDate = new Date('2026-01-01T00:00:00.000Z');
    const toDate = new Date('2026-03-31T23:59:59.999Z');
    reporting.incomeExpenseTrendResult = [
      { period: '2026-01', incomeCents: 100000, expenseCents: 40000 },
      { period: '2026-02', incomeCents: 100000, expenseCents: 55000 },
      { period: '2026-03', incomeCents: 100000, expenseCents: 60000 },
    ];

    const result = await useCase.execute({ ownerId: 'user-1', fromDate, toDate });

    expect(reporting.lastIncomeExpenseTrendCall).toEqual({ ownerId: 'user-1', fromDate, toDate });
    expect(result).toEqual([
      { period: '2026-01', incomeCents: 100000, expenseCents: 40000 },
      { period: '2026-02', incomeCents: 100000, expenseCents: 55000 },
      { period: '2026-03', incomeCents: 100000, expenseCents: 60000 },
    ]);
  });

  it('returns an empty array when there is no matching data', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      ownerId: 'user-1',
      fromDate: new Date('2026-01-01T00:00:00.000Z'),
      toDate: new Date('2026-01-31T23:59:59.999Z'),
    });

    expect(result).toEqual([]);
  });
});
