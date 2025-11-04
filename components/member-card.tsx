"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  MoreHorizontal, 
  MessageSquare, 
  AlertTriangle, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Activity
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Member } from "@/types"
import { cn, formatCurrency, getTimeAgo, generateGradient } from "@/lib/utils"

interface MemberCardProps {
  member: Member
  onSendMessage?: (member: Member) => void
  onViewDetails?: (member: Member) => void
  className?: string
}

const getChurnRiskColor = (risk: Member['churnRisk']) => {
  switch (risk) {
    case 'low':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'high':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

const getStatusVariant = (status: Member['status']) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'churned':
      return 'destructive'
    case 'at_risk':
      return 'warning'
    default:
      return 'secondary'
  }
}

const getChurnRiskIcon = (risk: Member['churnRisk']) => {
  switch (risk) {
    case 'high':
      return <AlertTriangle className="h-4 w-4" />
    case 'medium':
      return <TrendingDown className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

export function MemberCard({ 
  member, 
  onSendMessage, 
  onViewDetails, 
  className 
}: MemberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white text-sm font-medium",
                  `bg-gradient-to-br ${generateGradient(member.fullName || member.username || 'Unknown')}`
                )}
              >
                {(member.fullName || member.username || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {member.fullName || member.username || 'Unknown Member'}
                </h3>
                {member.email && (
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                )}
                {member.username && member.fullName && (
                  <p className="text-sm text-muted-foreground">@{member.username}</p>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails?.(member)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendMessage?.(member)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Activity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status and Tier */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusVariant(member.status)}>
                {member.status.replace('_', ' ')}
              </Badge>
              {member.tier && (
                <Badge variant="outline">{member.tier}</Badge>
              )}
            </div>
            <div
              className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                getChurnRiskColor(member.churnRisk)
              )}
            >
              {getChurnRiskIcon(member.churnRisk)}
              <span>{member.churnRisk} risk</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Engagement Score</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${member.engagementScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {Math.round(member.engagementScore * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-sm font-medium">{member.totalMessages}</p>
            </div>
          </div>

          {/* Revenue and Activity */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Revenue:</span>
              <span className="font-medium">
                {member.monthlyRevenue ? formatCurrency(member.monthlyRevenue) : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last seen:</span>
              <span className="font-medium">
                {member.lastLogin ? getTimeAgo(member.lastLogin) : 'Never'}
              </span>
            </div>
          </div>

          {/* Action Button for High Risk */}
          {member.churnRisk === 'high' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t"
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onSendMessage?.(member)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Retention Message
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}