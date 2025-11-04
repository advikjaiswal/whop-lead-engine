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
import { StatsCard } from "@/components/stats-card"
import { MemberCard } from "@/components/member-card"
import { AreaChartComponent } from "@/components/charts/area-chart"
import { dummyMembers } from "@/data/dummy"
import { Member } from "@/types"

export default function RetentionPage() {
  const [members, setMembers] = React.useState<Member[]>(dummyMembers)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [riskFilter, setRiskFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(false)

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
    const totalMembers = members.length
    const activeMembers = members.filter(m => m.status === 'active').length
    const atRiskMembers = members.filter(m => m.churnRisk === 'high').length
    const churnedMembers = members.filter(m => m.status === 'churned').length
    
    const retentionRate = totalMembers > 0 ? ((totalMembers - churnedMembers) / totalMembers) * 100 : 0
    const avgEngagement = members.reduce((sum, member) => sum + member.engagementScore, 0) / members.length * 100

    return {
      total: totalMembers,
      active: activeMembers,
      atRisk: atRiskMembers,
      churned: churnedMembers,
      retentionRate: Math.round(retentionRate * 10) / 10,
      avgEngagement: Math.round(avgEngagement)
    }
  }, [members])

  // Sample retention data for chart
  const retentionData = [
    { name: 'Jan', value: 92 },
    { name: 'Feb', value: 89 },
    { name: 'Mar', value: 94 },
    { name: 'Apr', value: 91 },
    { name: 'May', value: 88 },
    { name: 'Jun', value: 93 },
    { name: 'Jul', value: 95 },
    { name: 'Aug', value: 92 },
    { name: 'Sep', value: 89 },
    { name: 'Oct', value: 94 },
    { name: 'Nov', value: 96 }
  ]

  const handleSyncMembers = () => {
    setLoading(true)
    // Simulate sync
    setTimeout(() => {
      setLoading(false)
      // TODO: Implement actual sync functionality
    }, 2000)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Retention</h1>
          <p className="text-muted-foreground">
            Monitor member engagement and prevent churn with AI-powered insights.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSyncMembers} loading={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Members
          </Button>
          <Button size="sm" onClick={handleBulkRetentionCampaign}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Retention Campaign
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={stats.total}
          icon={Users}
          format="number"
        />
        <StatsCard
          title="Active Members"
          value={stats.active}
          change={5.2}
          trend="up"
          icon={TrendingUp}
          format="number"
        />
        <StatsCard
          title="At Risk"
          value={stats.atRisk}
          change={-12.5}
          trend="down"
          icon={AlertTriangle}
          format="number"
        />
        <StatsCard
          title="Retention Rate"
          value={stats.retentionRate}
          change={2.1}
          trend="up"
          icon={BarChart3}
          format="percentage"
        />
      </div>

      {/* Retention Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaChartComponent
            title="Retention Rate Trend"
            description="Monthly retention rate over time"
            data={retentionData}
            dataKey="value"
            color="#10b981"
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