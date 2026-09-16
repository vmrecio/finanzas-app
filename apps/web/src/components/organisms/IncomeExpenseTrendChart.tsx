'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { IncomeExpenseTrendEntry } from '../../lib/api-client';
import { Card } from '../atoms/Card';
import { MoneyDisplay } from '../atoms/MoneyDisplay';
import { formatCents } from '../atoms/money';

export interface IncomeExpenseTrendChartProps {
  data: IncomeExpenseTrendEntry[];
}

// Design-system tokens (see globals.css / DESIGN.md) — Recharts renders raw
// SVG, so these need literal color values rather than Tailwind classes.
const GRID_COLOR = '#e2e7ff'; // surface-container-high
const AXIS_COLOR = '#424656'; // on-surface-variant
const INCOME_COLOR = '#006c49'; // secondary (success)
const EXPENSE_COLOR = '#b21320'; // tertiary (destructive)

/**
 * Line chart of income vs. expense totals per month, plus an accessible data
 * table rendered alongside it (same rationale as `SpendByCategoryChart`).
 */
export function IncomeExpenseTrendChart({ data }: IncomeExpenseTrendChartProps) {
  if (data.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">No transaction data for this period yet.</p>;
  }

  return (
    <Card as="section" aria-label="Income vs expense trend" className="flex flex-col overflow-hidden">
      <div className="border-b border-outline-variant px-6 py-4">
        <h2 className="text-headline-sm text-on-surface">Income vs expense trend</h2>
      </div>
      <div className="flex flex-col gap-6 p-6">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <YAxis tickFormatter={formatCents} tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCents(Number(value))} />
              <Line type="monotone" dataKey="incomeCents" stroke={INCOME_COLOR} name="Income" strokeWidth={2} />
              <Line type="monotone" dataKey="expenseCents" stroke={EXPENSE_COLOR} name="Expense" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <caption className="sr-only">Income vs expense by month</caption>
            <thead>
              <tr className="border-b border-outline-variant text-label-caps text-on-surface-variant">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 text-right font-medium">Income</th>
                <th className="py-2 text-right font-medium">Expense</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.period} className="border-b border-surface-container last:border-0">
                  <td className="py-2 text-on-surface">{entry.period}</td>
                  <td className="py-2 text-right">
                    <MoneyDisplay amountCents={entry.incomeCents} className="text-data-md text-secondary" />
                  </td>
                  <td className="py-2 text-right">
                    <MoneyDisplay amountCents={entry.expenseCents} className="text-data-md text-on-surface" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
