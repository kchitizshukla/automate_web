'use client';

import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const PALETTE = ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#6366f1', '#94a3b8'];
const tip = { contentStyle: { borderRadius: '0.75rem', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 12px 32px -12px rgba(15,23,42,0.2)', fontSize: '0.8rem' } };

export function EarningsArea({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} width={52} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
        <Tooltip {...tip} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Earned']} />
        <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#earn)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function JobsDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip {...tip} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
