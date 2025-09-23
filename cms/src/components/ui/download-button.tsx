import { cn } from '@/utilities/ui'
import { Button } from './button'
import { ArrowRight } from 'lucide-react'

export default function DownloadButton({
  variant = 'default',
  className,
  title = 'Download App',
}: {
  variant?: 'default' | 'invert'
  className?: string
  title?: string
}) {
  return (
    <Button
      size={'sm'}
      className={cn('rounded-full flex items-center gap-2 text-black cursor-pointer', className, {
        'bg-white hover:bg-gray-100': variant == 'default',
        'bg-secondary-background hover:bg-secondary-dark': variant == 'invert',
      })}
    >
      {title}
      <div
        className={cn(' p-1 rounded-full items-center flex justify-between', {
          'bg-secondary-background': variant == 'default',
          'bg-white': variant == 'invert',
        })}
      >
        <ArrowRight size={13} className="text-black" />
      </div>
    </Button>
  )
}
