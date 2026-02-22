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
  Open: 'hsl(var(--primary))',
  Frozen: 'hsl(var(--chart-4))',
  Broken: 'hsl(0, 84%, 60%)',
  Sealed: 'hsl(var(--muted-foreground))',
}

const chartConfig = {
  Open: { label: 'Open', color: 'hsl(var(--primary))' },
  Frozen: { label: 'Frozen', color: 'hsl(var(--chart-4))' },
  Broken: { label: 'Broken', color: 'hsl(0, 84%, 60%)' },
  Sealed: { label: 'Sealed', color: 'hsl(var(--muted-foreground))' },
} satisfies ChartConfig

export function JarStatusChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jar Status</CardTitle>
        <CardDescription>Distribution of jars by status</CardDescription>
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
