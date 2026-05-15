'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { GlassCard } from '@/components/oasis/glass-card';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  type?: 'area' | 'bar';
  color?: string;
  valuePrefix?: string;
  currentValue?: string | number;
  percentageChange?: number;
}

export function AnalyticsCard({ 
  title, 
  subtitle, 
  data, 
  dataKey, 
  xAxisKey, 
  type = 'area', 
  color = '#10b981', 
  valuePrefix = '',
  currentValue,
  percentageChange = 0
}: AnalyticsCardProps) {
  return (
    <GlassCard className="overflow-hidden flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
          {currentValue !== undefined && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-foreground">
                {valuePrefix}{currentValue}
              </span>
              {percentageChange !== 0 && (
                <div className={`flex items-center text-xs font-bold ${percentageChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {percentageChange > 0 ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                  {Math.abs(percentageChange)}%
                </div>
              )}
            </div>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center">
          <TrendingUp className="size-5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 min-h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  borderRadius: '16px', 
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#111827' }}
              />
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#gradient-${dataKey})`} 
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  borderRadius: '16px', 
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={color} opacity={0.6 + (index / data.length) * 0.4} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
