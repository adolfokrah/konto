import { cn } from '@/utilities/ui'

export default function Ring({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-full border-50 w-[600px] h-[600px] border-secondary-dark', className)}
    ></div>
  )
}
