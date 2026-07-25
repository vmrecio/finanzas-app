'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { IncomeExpenseTrendEntry } from '../../lib/api-client';
import { MoneyDisplay } from '../atoms/MoneyDisplay';
import { formatCents } from '../atoms/money';

export interface IncomeExpenseTrendChartProps {
  data: IncomeExpenseTrendEntry[];
}

/**
 * Line chart of income vs. expense totals per month, plus an accessible data
 * table rendered alongside it (same rationale as `SpendByCategoryChart`).
 */
export function IncomeExpenseTrendChart({ data }: IncomeExpenseTrendChartProps) {
  if (data.length === 0) {
    return <p>No transaction data for this period yet.</p>;
  }

  return (
    <section aria-label="Income vs expense trend">
      <h2>Income vs expense trend</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={formatCents} />
            <Tooltip formatter={(value) => formatCents(Number(value))} />
            <Line type="monotone" dataKey="incomeCents" stroke="#2e7d32" name="Income" />
            <Line type="monotone" dataKey="expenseCents" stroke="#c62828" name="Expense" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table>
        <caption>Income vs expense by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expense</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.period}>
              <td>{entry.period}</td>
              <td>
                <MoneyDisplay amountCents={entry.incomeCents} />
              </td>
              <td>
                <MoneyDisplay amountCents={entry.expenseCents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
