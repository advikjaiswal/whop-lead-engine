"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn, formatNumber, formatCurrency, formatPercentage } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  format?: 'number' | 'currency' | 'percentage'
  className?: string
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  format = 'number',
  className,
  loading = false,
}: StatsCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      default:
        return formatNumber(val)
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={cn("overflow-hidden cursor-pointer transition-all hover:shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold tracking-tight"
              >
                {formatValue(value)}
              </motion.p>
              {change !== undefined && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium",
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  <span>
                    {Math.abs(change)}%{' '}
                    <span className="text-muted-foreground">
                      from last month
                    </span>
                  </span>
                </motion.div>
              )}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted"
            >
              <Icon className="h-6 w-6 text-muted-foreground" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}