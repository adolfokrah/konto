'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type Range = 'daily' | 'monthly' | 'yearly'

type Props = {
  data: { date: string; totalUsers: number }[]
  range?: Range
}

const chartConfig = {
  totalUsers: {
    label: 'Total Users',
    color: 'hsl(var(--chart-2))',
  },
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
  daily: 'Cumulative user registrations over the last 30 days',
  monthly: 'Cumulative user registrations over the last 12 months',
  yearly: 'Cumulative user registrations by year',
}

export function UserGrowthChart({ data, range = 'daily' }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>{descriptions[range]}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-totalUsers)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-totalUsers)" stopOpacity={0} />
              </linearGradient>
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
                <ChartTooltipContent
                  labelFormatter={(v) => tooltipFormatter(v, range)}
                />
              }
            />
            <Area
              dataKey="totalUsers"
              type="monotone"
              fill="url(#fillUsers)"
              stroke="var(--color-totalUsers)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
