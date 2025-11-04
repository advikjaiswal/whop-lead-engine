"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Target, Users } from "lucide-react"

import { StatsCard } from "@/components/stats-card"
import { AreaChartComponent } from "@/components/charts/area-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dummyChartData, dummyRevenueData } from "@/data/dummy"

export default function AnalyticsPage() {
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
          title="Lead Conversion"
          value={7.2}
          change={12.5}
          trend="up"
          icon={Target}
          format="percentage"
        />
        <StatsCard
          title="Engagement Rate"
          value={68.4}
          change={5.1}
          trend="up"
          icon={TrendingUp}
          format="percentage"
        />
        <StatsCard
          title="Retention Rate"
          value={92.8}
          change={2.3}
          trend="up"
          icon={Users}
          format="percentage"
        />
        <StatsCard
          title="ROI"
          value={340}
          change={45.2}
          trend="up"
          icon={BarChart3}
          format="percentage"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AreaChartComponent
          title="Lead Generation Performance"
          description="Monthly lead discovery and conversion trends"
          data={dummyChartData}
          dataKey="value"
          color="#3b82f6"
        />
        <AreaChartComponent
          title="Revenue Analytics"
          description="Revenue growth from converted leads"
          data={dummyRevenueData}
          dataKey="value"
          color="#10b981"
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
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-green-600">✅ Strong Performance</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Lead quality has improved 25% this month with better AI targeting
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-blue-600">📈 Growth Opportunity</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consider expanding to LinkedIn for 40% more professional leads
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-yellow-600">⚠️ Attention Needed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Member engagement has dropped 12% - run retention campaign
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-purple-600">🎯 Optimization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Peak lead discovery time is 2-4 PM - schedule campaigns accordingly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}