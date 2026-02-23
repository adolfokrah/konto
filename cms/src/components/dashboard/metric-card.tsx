import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  valueClassName?: string
}

export function MetricCard({ title, value, description, icon: Icon, valueClassName }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
