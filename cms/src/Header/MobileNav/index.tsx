'use client'

import { CMSLink } from '@/components/Link'
import type { Header as HeaderType } from '@/payload-types'
import { cn } from '@/utilities/tw-merge'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
}

export const MobileNav: React.FC<{ data: HeaderType; className?: string }> = ({
  data,
  className,
}) => {
  const navItems = data?.navItems || []

  return (
    <motion.div
      className={cn('flex flex-col gap-5 pb-7', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {navItems.map((item, index) => (
        <motion.div key={index} variants={itemVariants}>
          <CMSLink {...item.link} appearance="link" />
        </motion.div>
      ))}
    </motion.div>
  )
}
