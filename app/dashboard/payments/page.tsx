"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, CreditCard, PieChart } from "lucide-react"

import { StatsCard } from "@/components/stats-card"
import { AreaChartComponent } from "@/components/charts/area-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dummyRevenueData } from "@/data/dummy"

export default function PaymentsPage() {
  const revenueStats = {
    totalRevenue: 24580,
    monthlyGrowth: 12.5,
    platformFee: 3687,
    ownerShare: 20893
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
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track revenue, manage payouts, and analyze financial performance.
          </p>
        </div>
        <Button>
          Configure Stripe
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={revenueStats.totalRevenue}
          change={revenueStats.monthlyGrowth}
          trend="up"
          icon={DollarSign}
          format="currency"
        />
        <StatsCard
          title="Platform Fee (15%)"
          value={revenueStats.platformFee}
          icon={CreditCard}
          format="currency"
        />
        <StatsCard
          title="Your Share (85%)"
          value={revenueStats.ownerShare}
          icon={TrendingUp}
          format="currency"
        />
        <StatsCard
          title="Conversion Rate"
          value={7.2}
          change={2.1}
          trend="up"
          icon={PieChart}
          format="percentage"
        />
      </div>

      {/* Revenue Chart */}
      <AreaChartComponent
        title="Revenue Growth"
        description="Monthly recurring revenue from converted leads"
        data={dummyRevenueData}
        dataKey="value"
        color="#10b981"
      />

      {/* Stripe Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
          <CardDescription>
            Connect your Stripe account to enable automated payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Stripe Connect</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button>Connect Stripe</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}