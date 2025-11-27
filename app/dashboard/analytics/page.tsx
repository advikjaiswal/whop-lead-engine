"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Target, Users } from "lucide-react"

import { AreaChartComponent as AreaChart } from "@/components/charts/area-chart"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { analyticsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Always try to fetch data regardless of user state
        const [leadAnalytics, revenueAnalytics] = await Promise.all([
          analyticsAPI.getLeadAnalytics(),
          analyticsAPI.getRevenueAnalytics()
        ])

        if (leadAnalytics.success && revenueAnalytics.success) {
          setAnalytics({
            leads: leadAnalytics.data,
            revenue: revenueAnalytics.data
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    )
  }

  // If no analytics data, show empty state
  if (!analytics) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your lead generation and retention performance.
          </p>
        </motion.div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg text-muted-foreground mb-4">No analytics data available</div>
          <p className="text-sm text-muted-foreground mb-6">Start by discovering some leads to see your analytics</p>
          <Button onClick={() => window.location.href = '/dashboard/leads'}>Go to Leads</Button>
        </div>
      </div>
    )
  }

  const leadData = analytics?.leads || {}
  const revenueData = analytics?.revenue || {}

  const leadChartData = (leadData.weekly_trends || []).map((item: any) => ({
    name: new Date(item.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: item.leads,
  }));

  const revenueChartData = (revenueData.revenue_trends || []).map((item: any) => ({
    name: item.month,
    value: item.revenue,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your lead generation and retention performance.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={leadData.total_leads || 0}
          change={0}
          trend="neutral"
          icon={Target}
          format="number"
        />
        <StatsCard
          title="Conversion Rate"
          value={
            leadData.total_leads > 0 
              ? Math.round((leadData.conversion_funnel?.converted || 0) / leadData.total_leads * 100)
              : 0
          }
          change={0}
          trend="neutral"
          icon={TrendingUp}
          format="percentage"
        />
        <StatsCard
          title="High Quality Leads"
          value={leadData.quality_distribution?.A || 0}
          change={0}
          trend="neutral"
          icon={Users}
          format="number"
        />
        <StatsCard
          title="Total Revenue"
          value={revenueData.total_revenue || 0}
          change={0}
          trend="neutral"
          icon={BarChart3}
          format="currency"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AreaChart
          title="Lead Generation Trends"
          description="Weekly lead discovery over the last 8 weeks"
          data={leadChartData}
          dataKey="value"
        />
        <AreaChart
          title="Revenue Analytics"
          description="Monthly revenue trends over the last 6 months"
          data={revenueChartData}
          dataKey="value"
          color="#84cc16"
        />
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key insights and recommendations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadData.total_leads > 0 ? (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600">✅ Lead Sources</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Object.entries(leadData.leads_by_source || {}).map(([source, count]) => 
                      `${source}: ${count}`
                    ).join(', ') || 'No sources available'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-blue-600">📈 Lead Status</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Object.entries(leadData.leads_by_status || {}).map(([status, count]) => 
                      `${status}: ${count}`
                    ).join(', ') || 'No status data available'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-purple-600">🎯 Quality Distribution</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Object.entries(leadData.quality_distribution || {}).map(([grade, count]) => 
                      `Grade ${grade}: ${count}`
                    ).join(', ') || 'No quality data available'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600">💰 Revenue Summary</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: ${revenueData.total_revenue || 0} | 
                    MRR: ${revenueData.monthly_recurring_revenue || 0}
                  </p>
                </div>
              </>
            ) : (
              <div className="col-span-2 p-8 border rounded-lg text-center">
                <h3 className="font-medium text-muted-foreground">No Data Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start generating leads to see analytics and insights here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}