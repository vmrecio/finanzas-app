'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SpendByCategoryEntry } from '../../lib/api-client';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface SpendByCategoryChartProps {
  data: SpendByCategoryEntry[];
}

/**
 * Bar chart of expense totals by category, plus an accessible data list
 * rendered alongside it (Recharts' SVG output has no useful text-content for
 * assistive tech or for jsdom-based tests, so the list is the source of
 * truth for both).
 */
export function SpendByCategoryChart({ data }: SpendByCategoryChartProps) {
  if (data.length === 0) {
    return <p>No spending data for this period yet.</p>;
  }

  return (
    <section aria-label="Spend by category">
      <h2>Spend by category</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoryName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalCents" fill="#8884d8" name="Total spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul>
        {data.map((entry) => (
          <li key={entry.categoryId}>
            <span>{entry.categoryName}</span>
            <MoneyDisplay amountCents={entry.totalCents} />
          </li>
        ))}
      </ul>
    </section>
  );
}
