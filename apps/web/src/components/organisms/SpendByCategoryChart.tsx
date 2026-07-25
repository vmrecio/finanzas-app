'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SpendByCategoryEntry } from '../../lib/api-client';
import { Card } from '../atoms/Card';
import { MoneyDisplay } from '../atoms/MoneyDisplay';
import { formatCents } from '../atoms/money';

export interface SpendByCategoryChartProps {
  data: SpendByCategoryEntry[];
}

// Design-system tokens (see globals.css / DESIGN.md) — Recharts renders raw
// SVG, so these need literal color values rather than Tailwind classes.
const GRID_COLOR = '#e2e7ff'; // surface-container-high
const AXIS_COLOR = '#424656'; // on-surface-variant
const BAR_COLOR = '#0050cb'; // primary

/**
 * Bar chart of expense totals by category, plus an accessible data list
 * rendered alongside it (Recharts' SVG output has no useful text-content for
 * assistive tech or for jsdom-based tests, so the list is the source of
 * truth for both).
 */
export function SpendByCategoryChart({ data }: SpendByCategoryChartProps) {
  if (data.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">No spending data for this period yet.</p>;
  }

  return (
    <Card as="section" aria-label="Spend by category" className="flex flex-col overflow-hidden">
      <div className="border-b border-outline-variant px-6 py-4">
        <h2 className="text-headline-sm text-on-surface">Spend by category</h2>
      </div>
      <div className="flex flex-col gap-6 p-6">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="categoryName" tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <YAxis tickFormatter={formatCents} tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCents(Number(value))} />
              <Bar dataKey="totalCents" fill={BAR_COLOR} name="Total spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col divide-y divide-surface-container text-body-sm">
          {data.map((entry) => (
            <li key={entry.categoryId} className="flex items-center justify-between py-2">
              <span className="text-on-surface">{entry.categoryName}</span>
              <MoneyDisplay amountCents={entry.totalCents} className="text-data-md text-on-surface" />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
