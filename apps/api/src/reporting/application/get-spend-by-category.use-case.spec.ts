import { FakeReporting } from './test-fakes/fake-reporting';
import { GetSpendByCategoryUseCase } from './get-spend-by-category.use-case';

describe('GetSpendByCategoryUseCase', () => {
  function setup(): { useCase: GetSpendByCategoryUseCase; reporting: FakeReporting } {
    const reporting = new FakeReporting();
    const useCase = new GetSpendByCategoryUseCase(reporting);
    return { useCase, reporting };
  }

  it('delegates to the reporting port with the owner and date range', async () => {
    const { useCase, reporting } = setup();
    const fromDate = new Date('2026-07-01T00:00:00.000Z');
    const toDate = new Date('2026-07-31T23:59:59.999Z');
    reporting.spendByCategoryResult = [
      { categoryId: 'c1', categoryName: 'Groceries', totalCents: 3000 },
      { categoryId: 'c2', categoryName: 'Transport', totalCents: 1500 },
    ];

    const result = await useCase.execute({ ownerId: 'user-1', fromDate, toDate });

    expect(reporting.lastSpendByCategoryCall).toEqual({ ownerId: 'user-1', fromDate, toDate });
    expect(result).toEqual([
      { categoryId: 'c1', categoryName: 'Groceries', totalCents: 3000 },
      { categoryId: 'c2', categoryName: 'Transport', totalCents: 1500 },
    ]);
  });

  it('returns an empty array (not an error) when there is no matching data', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      ownerId: 'user-1',
      fromDate: new Date('2026-01-01T00:00:00.000Z'),
      toDate: new Date('2026-01-31T23:59:59.999Z'),
    });

    expect(result).toEqual([]);
  });
});
