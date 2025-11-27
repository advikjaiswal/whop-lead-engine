"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, CreditCard, PieChart } from "lucide-react"

import { AreaChartComponent as AreaChart } from "@/components/charts/area-chart"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { analyticsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function PaymentsPage() {
  const { user } = useAuth()
  const [revenueData, setRevenueData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        // Always try to fetch data regardless of user state
        const response = await analyticsAPI.getRevenueAnalytics()
        if (response.success && response.data) {
          setRevenueData(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch revenue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading payment data...</div>
        </div>
      </div>
    )
  }

  // If no revenue data, show empty state
  if (!revenueData) {
    return (
      <div className="space-y-8">
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
          <Button>Configure Stripe</Button>
        </motion.div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg text-muted-foreground mb-4">No payment data available</div>
          <p className="text-sm text-muted-foreground mb-6">Connect your payment provider to start tracking revenue</p>
          <Button>Configure Stripe</Button>
        </div>
      </div>
    )
  }

  const totalRevenue = revenueData?.total_revenue || 0
  const platformFee = revenueData?.platform_fees_total || 0
  const ownerShare = revenueData?.client_revenue_total || 0
  const chartData = (revenueData?.revenue_trends || []).map((item: any) => ({
    name: item.month,
    value: item.revenue,
  }));

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
          value={totalRevenue}
          change={0}
          trend="neutral"
          icon={DollarSign}
          format="currency"
        />
        <StatsCard
          title="Platform Fee (15%)"
          value={platformFee}
          icon={CreditCard}
          format="currency"
        />
        <StatsCard
          title="Your Share (85%)"
          value={ownerShare}
          icon={TrendingUp}
          format="currency"
        />
        <StatsCard
          title="MRR"
          value={revenueData?.monthly_recurring_revenue || 0}
          change={0}
          trend="neutral"
          icon={PieChart}
          format="currency"
        />
      </div>

      {/* Revenue Chart */}
      <AreaChart
        title="Revenue Growth"
        description="Monthly recurring revenue from converted leads"
        data={chartData}
        dataKey="value"
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