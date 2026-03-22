'use client'

import {
  Bar,
  BarChart,
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

interface CollectorPerformanceChartProps {
  data: { name: string; amount: number; count: number }[]
}

const chartConfig: ChartConfig = {
  amount: {
    label: 'Total Collected (GHS)',
    color: 'hsl(var(--chart-3))',
  },
}

export function CollectorPerformanceChart({ data }: CollectorPerformanceChartProps) {
  const top10 = data.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collector Performance</CardTitle>
        <CardDescription>Top 10 collectors by total contribution amount</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={top10}
            layout="vertical"
            margin={{ left: 12, right: 40 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={120}
            />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
