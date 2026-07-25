import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { DashboardContainer } from './DashboardContainer';

const { summaryMock, spendMock, trendMock } = vi.hoisted(() => ({
  summaryMock: vi.fn(),
  spendMock: vi.fn(),
  trendMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  getDashboardSummary: summaryMock,
  getSpendByCategory: spendMock,
  getIncomeExpenseTrend: trendMock,
  ApiError,
}));

describe('DashboardContainer', () => {
  beforeEach(() => {
    summaryMock.mockReset();
    spendMock.mockReset();
    trendMock.mockReset();
  });

  it('renders the summary stats and chart data once loaded', async () => {
    summaryMock.mockResolvedValueOnce({
      totalBalanceCents: 150000,
      periodIncomeCents: 200000,
      periodExpenseCents: 50000,
    });
    spendMock.mockResolvedValueOnce([
      { categoryId: 'cat-1', categoryName: 'Groceries', totalCents: 30000 },
    ]);
    trendMock.mockResolvedValueOnce([
      { period: '2026-06', incomeCents: 120000, expenseCents: 25000 },
      { period: '2026-07', incomeCents: 180000, expenseCents: 45000 },
    ]);

    render(<DashboardContainer />);

    expect(await screen.findByText('1.500,00 €')).toBeInTheDocument();
    expect(screen.getByText('2.000,00 €')).toBeInTheDocument();
    expect(screen.getByText('500,00 €')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('300,00 €')).toBeInTheDocument();
    expect(screen.getByText('2026-06')).toBeInTheDocument();
    expect(screen.getByText('2026-07')).toBeInTheDocument();
    expect(screen.getByText('1.200,00 €')).toBeInTheDocument();
    expect(screen.getByText('250,00 €')).toBeInTheDocument();
    expect(screen.getByText('1.800,00 €')).toBeInTheDocument();
    expect(screen.getByText('450,00 €')).toBeInTheDocument();
  });

  it('shows empty-state messaging when there is no data in range, not an error', async () => {
    summaryMock.mockResolvedValueOnce({
      totalBalanceCents: 0,
      periodIncomeCents: 0,
      periodExpenseCents: 0,
    });
    spendMock.mockResolvedValueOnce([]);
    trendMock.mockResolvedValueOnce([]);

    render(<DashboardContainer />);

    expect(await screen.findByText('No spending data for this period yet.')).toBeInTheDocument();
    expect(screen.getByText('No transaction data for this period yet.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error message when a report fails to load', async () => {
    summaryMock.mockRejectedValueOnce(new ApiError(500, 'Something went wrong'));
    spendMock.mockResolvedValueOnce([]);
    trendMock.mockResolvedValueOnce([]);

    render(<DashboardContainer />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('requests spend-by-category and trend over the same explicit date range, and summary with no range', async () => {
    summaryMock.mockResolvedValueOnce({
      totalBalanceCents: 0,
      periodIncomeCents: 0,
      periodExpenseCents: 0,
    });
    spendMock.mockResolvedValueOnce([]);
    trendMock.mockResolvedValueOnce([]);

    render(<DashboardContainer />);

    await screen.findByText('No spending data for this period yet.');

    expect(summaryMock).toHaveBeenCalledWith();
    const spendArg = spendMock.mock.calls[0]?.[0];
    const trendArg = trendMock.mock.calls[0]?.[0];
    expect(spendArg).toEqual(trendArg);
    expect(spendArg?.fromDate).toEqual(expect.any(String));
    expect(spendArg?.toDate).toEqual(expect.any(String));
  });
});
