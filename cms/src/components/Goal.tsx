'use client'

import { useMemo } from 'react'

interface GoalProps {
  currentAmount: number
  targetAmount: number
  deadline: string
  currency?: string
  className?: string
}

export default function Goal({
  currentAmount,
  targetAmount,
  deadline,
  currency = '₵',
  className = '',
}: GoalProps) {
  const progressPercentage = useMemo(() => {
    return Math.min((currentAmount / targetAmount) * 100, 100)
  }, [currentAmount, targetAmount])

  const daysLeft = useMemo(() => {
    const deadlineDate = new Date(deadline)
    const currentDate = new Date()
    const diffTime = deadlineDate.getTime() - currentDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 0)
  }, [deadline])

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className={`bg-primary-light rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 font-supreme">Goal</h3>
      </div>

      {/* Amount Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-black font-supreme">
            {currency}
            {formatAmount(currentAmount)}
          </span>
          <span className="text-sm text-gray-600 font-supreme">
            of {currency}
            {formatAmount(targetAmount)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Deadline and Days Left */}
      <div className="flex items-center justify-between text-sm font-supreme">
        <span className="text-gray-700">Deadline {formatDeadline(deadline)}</span>
        <span className="font-medium text-gray-900">{daysLeft} days left</span>
      </div>
    </div>
  )
}
