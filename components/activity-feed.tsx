"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Target, UserPlus, MessageSquare, DollarSign, Activity } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFeedItem } from "@/types"
import { getTimeAgo } from "@/lib/utils"

interface ActivityFeedProps {
  activities: ActivityFeedItem[]
  className?: string
}

const getActivityIcon = (type: ActivityFeedItem['type']) => {
  switch (type) {
    case 'lead_generated':
      return Target
    case 'lead_converted':
      return DollarSign
    case 'campaign_sent':
      return MessageSquare
    case 'member_joined':
      return UserPlus
    case 'member_churned':
      return Activity
    default:
      return Activity
  }
}

const getActivityColor = (type: ActivityFeedItem['type']) => {
  switch (type) {
    case 'lead_generated':
      return 'bg-blue-500'
    case 'lead_converted':
      return 'bg-green-500'
    case 'campaign_sent':
      return 'bg-purple-500'
    case 'member_joined':
      return 'bg-emerald-500'
    case 'member_churned':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your lead generation system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type)
            const iconColor = getActivityColor(activity.type)

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconColor}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No recent activity to display
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}