'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ProviderSplitChartProps {
  data: { provider: string; volume: number; count: number }[]
}

const chartConfig: ChartConfig = {
  volume: {
    label: 'Volume (GHS)',
    color: 'hsl(var(--chart-2))',
  },
  count: {
    label: 'Transactions',
    color: 'hsl(var(--chart-4))',
  },
}

export function ProviderSplitChart({ data }: ProviderSplitChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile Money Provider Split</CardTitle>
        <CardDescription>MTN vs Telecel — volume and transaction count</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="provider"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
