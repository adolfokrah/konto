'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

type Props = {
  data: { date: string; contributions: number; payouts: number }[]
}

const chartConfig = {
  contributions: {
    label: 'Contributions',
    color: 'hsl(var(--primary))',
  },
  payouts: {
    label: 'Payouts',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig

export function RevenueChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Contributions and payouts over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillContributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-contributions)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-contributions)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillPayouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-payouts)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-payouts)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="contributions"
              type="monotone"
              fill="url(#fillContributions)"
              stroke="var(--color-contributions)"
              strokeWidth={2}
            />
            <Area
              dataKey="payouts"
              type="monotone"
              fill="url(#fillPayouts)"
              stroke="var(--color-payouts)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
