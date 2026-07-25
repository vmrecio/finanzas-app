import { FakeReporting } from './test-fakes/fake-reporting';
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';

describe('GetDashboardSummaryUseCase', () => {
  function setup(now?: () => Date): {
    useCase: GetDashboardSummaryUseCase;
    reporting: FakeReporting;
  } {
    const reporting = new FakeReporting();
    const useCase = new GetDashboardSummaryUseCase(reporting, now);
    return { useCase, reporting };
  }

  it('delegates to the reporting port with the owner and the explicit period when given', async () => {
    const { useCase, reporting } = setup();
    const periodStart = new Date('2026-05-01T00:00:00.000Z');
    const periodEnd = new Date('2026-05-31T23:59:59.999Z');
    reporting.dashboardSummaryResult = {
      totalBalanceCents: 12000,
      periodIncomeCents: 5000,
      periodExpenseCents: 2000,
    };

    const result = await useCase.execute({ ownerId: 'user-1', periodStart, periodEnd });

    expect(reporting.lastDashboardSummaryCall).toEqual({
      ownerId: 'user-1',
      periodStart,
      periodEnd,
    });
    expect(result).toEqual({ totalBalanceCents: 12000, periodIncomeCents: 5000, periodExpenseCents: 2000 });
  });

  it('defaults the period to the current calendar month when none is given', async () => {
    const { useCase, reporting } = setup(() => new Date('2026-07-15T12:00:00.000Z'));

    await useCase.execute({ ownerId: 'user-1' });

    expect(reporting.lastDashboardSummaryCall).toEqual({
      ownerId: 'user-1',
      periodStart: new Date('2026-07-01T00:00:00.000Z'),
      periodEnd: new Date('2026-07-31T23:59:59.999Z'),
    });
  });
});
