"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { analyticsAPI, workspaceAPI } from "@/lib/api"
import { toast } from "sonner"
import { StatsCard } from "@/components/stats-card"
import { ActivityFeed } from "@/components/activity-feed"
import { AreaChartComponent as AreaChart } from "@/components/charts/area-chart"
import { DollarSign, Users, MessageSquare, UserPlus, TrendingUp } from "lucide-react"
import { ActivityFeedItem, DashboardStats } from "@/types"

const dummyChartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 600 },
  { name: 'Jun', value: 700 },
];

const dummyActivities: ActivityFeedItem[] = [
  { id: '1', type: 'lead_converted', title: 'New Sale!', description: 'Lead "alex_dev" converted to a paying member.', timestamp: new Date() },
  { id: '2', type: 'lead_generated', title: 'New Lead Found', description: 'Discovered a new lead from r/entrepreneur.', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '3', type: 'campaign_sent', title: 'Campaign Sent', description: '"Welcome" sequence sent to 15 new leads.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
];

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (!token) {
          setIsLoading(false)
          return
        }

        // Check if workspace exists
        try {
          await workspaceAPI.getWorkspace()
        } catch (error) {
          // If workspace not found, redirect to setup
          router.push("/dashboard/setup")
          return
        }

        const statsRes = await analyticsAPI.getDashboardStats()
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
        } else {
          toast.error("Failed to load dashboard stats.")
        }
      } catch (error) {
        toast.error("An error occurred while fetching dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard title="Revenue Generated (30d)" value={`${stats.revenue_generated.toFixed(2)}`} icon={DollarSign} />
          <StatsCard title="Paid Members Added (30d)" value={stats.paid_members_added} icon={UserPlus} />
          <StatsCard title="New Leads Captured (30d)" value={stats.new_leads_captured} icon={Users} />
          <StatsCard title="Warm Leads" value={stats.warm_leads} icon={TrendingUp} />
          <StatsCard title="Outreach Messages Sent" value={stats.outreach_messages_sent} icon={MessageSquare} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AreaChart
            title="Revenue Over Time"
            description="A chart showing revenue trends."
            data={dummyChartData}
            dataKey="value"
          />
        </div>
        <div>
          <ActivityFeed activities={dummyActivities} />
        </div>
      </div>
    </div>
  )
}