'use client'

import { Pie, PieChart, Cell } from 'recharts'
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
  data: { name: string; value: number }[]
}

const COLORS: Record<string, string> = {
  'Mobile Money': 'hsl(var(--primary))',
  Cash: 'hsl(var(--chart-2))',
  Bank: 'hsl(var(--chart-3))',
  Card: 'hsl(var(--chart-4))',
  'Apple Pay': 'hsl(var(--chart-5))',
}

const chartConfig = {
  'Mobile Money': { label: 'Mobile Money', color: 'hsl(var(--primary))' },
  Cash: { label: 'Cash', color: 'hsl(var(--chart-2))' },
  Bank: { label: 'Bank', color: 'hsl(var(--chart-3))' },
  Card: { label: 'Card', color: 'hsl(var(--chart-4))' },
  'Apple Pay': { label: 'Apple Pay', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig

export function PaymentMethodChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Completed contributions by payment method</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] || 'hsl(var(--muted))'} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
