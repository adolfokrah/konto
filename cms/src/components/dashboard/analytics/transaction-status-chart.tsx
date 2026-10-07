'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type Props = {
  data: { status: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Completed: 'hsl(var(--success))',
  Pending: 'hsl(var(--warning))',
  Failed: 'hsl(var(--destructive))',
  Transferred: 'hsl(var(--chart-4))',
}

const chartConfig = {
  count: {
    label: 'Transactions',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function TransactionStatusChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Status</CardTitle>
        <CardDescription>Distribution by payment status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'hsl(var(--primary))'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
