'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'

type Range = 'daily' | 'monthly' | 'yearly'

interface RefundVolumeTrendChartProps {
  data: { date: string; amount: number }[]
  range?: Range
}

const chartConfig: ChartConfig = {
  amount: {
    label: 'Refund Amount (GHS)',
    color: 'hsl(var(--chart-1))',
  },
}

function tickFormatter(value: string, range: Range) {
  if (range === 'yearly') return value
  if (range === 'monthly') {
    const [year, month] = value.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function tooltipFormatter(value: string, range: Range) {
  if (range === 'yearly') return value
  if (range === 'monthly') {
    const [year, month] = value.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getDescription(range: Range) {
  if (range === 'daily') return 'Daily refund amounts over the last 30 days'
  if (range === 'monthly') return 'Monthly refund amounts over the last 12 months'
  return 'Refund amounts by year'
}

export function RefundVolumeTrendChart({ data, range = 'daily' }: RefundVolumeTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Volume</CardTitle>
        <CardDescription>{getDescription(range)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="fillRefund" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => tickFormatter(value, range)}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} domain={[0, (max: number) => max > 0 ? Math.ceil(max * 1.15) : 1]} />
            <Tooltip
              labelFormatter={(value) => tooltipFormatter(value, range)}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="amount"
              type="monotone"
              fill="url(#fillRefund)"
              stroke="var(--color-amount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
