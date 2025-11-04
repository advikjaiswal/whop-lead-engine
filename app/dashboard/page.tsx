"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Target, Users, DollarSign, TrendingUp, Plus, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { ActivityFeed } from "@/components/activity-feed"
import { AreaChartComponent } from "@/components/charts/area-chart"
import { analyticsAPI } from "@/lib/api"
import { DashboardStats } from "@/types"

export default function DashboardPage() {
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats>({
    leadsGenerated: { total: 0, change: 0, trend: 'neutral' },
    conversions: { total: 0, change: 0, trend: 'neutral' },
    revenue: { total: 0, change: 0, trend: 'neutral' },
    retention: { rate: 0, change: 0, trend: 'neutral' }
  })
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<{authenticated: boolean} | null>(null)

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token')
        if (!token) {
          window.location.href = '/login'
          return
        }

        // Redirect demo users to create real accounts
        if (token === 'demo-token') {
          localStorage.removeItem('auth_token')
          window.location.href = '/signup'
          return
        }

        // Fetch real dashboard stats
        const statsResponse = await analyticsAPI.getDashboardStats()
        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data)
        }

        // Set user as authenticated
        setUser({ authenticated: true })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Show empty dashboard for new users
        setDashboardStats({
          leadsGenerated: { total: 0, change: 0, trend: 'neutral' },
          conversions: { total: 0, change: 0, trend: 'neutral' },
          revenue: { total: 0, change: 0, trend: 'neutral' },
          retention: { rate: 0, change: 0, trend: 'neutral' }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your lead generation.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/leads'}>
            <Eye className="mr-2 h-4 w-4" />
            View All Leads
          </Button>
          <Button size="sm" onClick={() => window.location.href = '/dashboard/leads'}>
            <Plus className="mr-2 h-4 w-4" />
            Discover Leads
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leads Generated"
          value={dashboardStats.leadsGenerated.total}
          change={dashboardStats.leadsGenerated.change}
          trend={dashboardStats.leadsGenerated.trend}
          icon={Target}
          format="number"
        />
        <StatsCard
          title="Conversions"
          value={dashboardStats.conversions.total}
          change={dashboardStats.conversions.change}
          trend={dashboardStats.conversions.trend}
          icon={TrendingUp}
          format="number"
        />
        <StatsCard
          title="Total Revenue"
          value={dashboardStats.revenue.total}
          change={dashboardStats.revenue.change}
          trend={dashboardStats.revenue.trend}
          icon={DollarSign}
          format="currency"
        />
        <StatsCard
          title="Retention Rate"
          value={dashboardStats.retention.rate}
          change={dashboardStats.retention.change}
          trend={dashboardStats.retention.trend}
          icon={Users}
          format="percentage"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
            <CardDescription>Number of new leads discovered over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {dashboardStats.leadsGenerated.total === 0 
                ? "No leads generated yet. Start discovering leads to see trends."
                : "Chart data will appear once you generate leads."
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly recurring revenue from converted leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {dashboardStats.revenue.total === 0 
                ? "No revenue tracked yet. Convert leads to see growth."
                : "Revenue data will appear once you have conversions."
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest lead generation activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No recent activity. Start generating leads to see activity here.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Import New Leads
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Sync Members
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Health Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Connection</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Services</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-yellow-600">Limited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}