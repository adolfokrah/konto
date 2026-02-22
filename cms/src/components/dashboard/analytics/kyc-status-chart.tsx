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
  'Not Started': 'hsl(var(--muted-foreground))',
  'In Review': 'hsl(var(--chart-4))',
  Verified: 'hsl(var(--primary))',
}

const chartConfig = {
  'Not Started': { label: 'Not Started', color: 'hsl(var(--muted-foreground))' },
  'In Review': { label: 'In Review', color: 'hsl(var(--chart-4))' },
  Verified: { label: 'Verified', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

export function KycStatusChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Status</CardTitle>
        <CardDescription>User verification distribution</CardDescription>
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
              innerRadius={50}
              outerRadius={80}
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
