"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MessageSquare,
  Filter,
  Search,
  BarChart3
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AreaChartComponent as AreaChart } from "@/components/charts/area-chart"
import { StatsCard } from "@/components/stats-card"
import { MemberCard } from "@/components/member-card"
import { membersAPI, analyticsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Member } from "@/types"

export default function RetentionPage() {
  const { user } = useAuth()
  const [members, setMembers] = React.useState<Member[]>([])
  const [retentionData, setRetentionData] = React.useState<any>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [riskFilter, setRiskFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Always try to fetch data regardless of user state
        const [membersResponse, retentionResponse] = await Promise.all([
          membersAPI.getMembers(),
          analyticsAPI.getRetentionAnalytics()
        ])

        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data.members || [])
        }

        if (retentionResponse.success && retentionResponse.data) {
          setRetentionData(retentionResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch retention data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter members based on search and filters
  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const matchesSearch =
        member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || member.status === statusFilter
      const matchesRisk = riskFilter === "all" || member.churnRisk === riskFilter

      return matchesSearch && matchesStatus && matchesRisk
    })
  }, [members, searchQuery, statusFilter, riskFilter])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalMembers = retentionData?.total_members || members.length
    const activeMembers = members.filter(m => m.status === 'active').length
    const atRiskMembers = Object.values(retentionData?.churn_risk_distribution || {}).reduce((sum: number, count: any) => {
      return sum + (typeof count === 'number' ? count : 0)
    }, 0) as number
    const churnedMembers = members.filter(m => m.status === 'churned').length

    const retentionRate = retentionData?.retention_success_rate ||
      (totalMembers > 0 ? ((totalMembers - churnedMembers) / totalMembers) * 100 : 0)
    const avgEngagement = members.reduce((sum, member) => sum + member.engagementScore, 0) / members.length * 100

    return {
      total: totalMembers,
      active: activeMembers,
      atRisk: atRiskMembers,
      churned: churnedMembers,
      retentionRate: Math.round(retentionRate * 10) / 10,
      avgEngagement: Math.round(avgEngagement)
    }
  }, [members, retentionData])

  // Get chart data from retention analytics
  const chartData = (retentionData?.activity_trends || []).map((item: any) => ({
    name: new Date(item.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: item.active_members,
  }));

  const handleSyncMembers = async () => {
    setSyncing(true)
    try {
      const response = await membersAPI.syncMembers()
      if (response.success) {
        // Refresh members data
        const membersResponse = await membersAPI.getMembers()
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data.members || [])
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleSendMessage = (member: Member) => {
    console.log("Send message to:", member)
    // TODO: Open message modal or redirect to messaging
  }

  const handleViewDetails = (member: Member) => {
    console.log("View member details:", member)
    // TODO: Open member detail modal
  }

  const handleBulkRetentionCampaign = () => {
    const highRiskMembers = members.filter(m => m.churnRisk === 'high')
    console.log("Send retention campaign to", highRiskMembers.length, "high-risk members")
    // TODO: Implement bulk retention campaign
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading retention data...</div>
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
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Member Retention</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Monitor member engagement and prevent churn with AI-powered insights.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleSyncMembers} loading={syncing} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Members
          </Button>
          <Button size="sm" onClick={handleBulkRetentionCampaign} className="w-full sm:w-auto">
            <MessageSquare className="mr-2 h-4 w-4" />
            Retention Campaign
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={stats.total}
          icon={Users}
          format="number"
        />
        <StatsCard
          title="Active Members"
          value={stats.active}
          icon={TrendingUp}
          format="number"
        />
        <StatsCard
          title="At Risk"
          value={stats.atRisk}
          icon={AlertTriangle}
          format="number"
        />
        <StatsCard
          title="Retention Rate"
          value={stats.retentionRate}
          icon={BarChart3}
          format="percentage"
        />
      </div>

      {/* Retention Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaChart
            title="Member Activity Trends"
            description="Weekly active member count over the last 4 weeks"
            data={chartData}
            dataKey="value"
            className="h-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Retention management shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Welcome Series
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alert High Risk
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingDown className="mr-2 h-4 w-4" />
              Win-Back Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Engagement Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Member Filters</CardTitle>
          <CardDescription>
            Search and filter members to focus on specific segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                  Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("at_risk")}>
                  At Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("churned")}>
                  Churned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Risk: {riskFilter === "all" ? "All" : riskFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Churn Risk</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRiskFilter("all")}>
                  All Risk Levels
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter("low")}>
                  Low Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter("medium")}>
                  Medium Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter("high")}>
                  High Risk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || statusFilter !== "all" || riskFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setRiskFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {filteredMembers.length !== members.length && (
            <div className="mt-4">
              <Badge variant="secondary">
                Showing {filteredMembers.length} of {members.length} members
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member, index) => (
          <MemberCard
            key={member.id}
            member={member}
            onSendMessage={handleSendMessage}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No members found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or sync with your Whop community
            </p>
            <Button onClick={handleSyncMembers}>Sync Members</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}