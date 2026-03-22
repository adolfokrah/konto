'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type Range = 'daily' | 'monthly' | 'yearly'

export type ContributionVolumeByMethodData = {
  date: string
  mobileMoney: number
  cash: number
  bank: number
  card: number
}

type Props = {
  data: ContributionVolumeByMethodData[]
  range?: Range
}

const chartConfig = {
  mobileMoney: { label: 'Mobile Money', color: 'hsl(var(--chart-2))' },
  cash: { label: 'Cash', color: 'hsl(var(--chart-1))' },
  bank: { label: 'Bank', color: 'hsl(var(--chart-3))' },
  card: { label: 'Card', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig

function tickFormatter(value: string, range: Range) {
  if (range === 'yearly') return value
  if (range === 'monthly') {
    const [year, month] = value.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  }
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function tooltipFormatter(value: string, range: Range) {
  if (range === 'yearly') return value
  if (range === 'monthly') {
    const [year, month] = value.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const descriptions: Record<Range, string> = {
  daily: 'Daily breakdown by payment method over the last 30 days',
  monthly: 'Monthly breakdown by payment method over the last 12 months',
  yearly: 'Yearly breakdown by payment method',
}

const ALL_METHODS = ['mobileMoney', 'cash', 'bank', 'card'] as const
type Method = (typeof ALL_METHODS)[number]

export function ContributionVolumeByMethodChart({ data, range = 'daily' }: Props) {
  // Only show methods that have at least one non-zero value
  const activeMethods = ALL_METHODS.filter((m) => data.some((d) => d[m] > 0))

  const activeConfig = Object.fromEntries(
    activeMethods.map((m) => [m, chartConfig[m]]),
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Volume by Payment Method</CardTitle>
        <CardDescription>{descriptions[range]}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activeConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
            <defs>
              {activeMethods.map((m) => (
                <linearGradient key={m} id={`fill-${m}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${m})`} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={`var(--color-${m})`} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => tickFormatter(v, range)}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(v) => tooltipFormatter(v, range)} />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {activeMethods.map((m) => (
              <Area
                key={m}
                dataKey={m}
                type="monotone"
                fill={`url(#fill-${m})`}
                stroke={`var(--color-${m})`}
                strokeWidth={2}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
