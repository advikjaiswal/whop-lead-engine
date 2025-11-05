"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Upload, 
  Filter, 
  Download, 
  Search,
  Target,
  TrendingUp,
  Users,
  MessageSquare
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
import { LeadsTable } from "@/components/leads-table"
import { SimpleLeadDiscovery } from "@/components/simple-lead-discovery"
import { Lead } from "@/types"
import { leadsAPI } from "@/lib/api"
import { toast } from "sonner"

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(false)
  const [discoveryModalOpen, setDiscoveryModalOpen] = React.useState(false)

  // Fetch leads from API on component mount
  React.useEffect(() => {
    const fetchLeads = async () => {
      try {
        setInitialLoading(true)
        const response = await leadsAPI.getLeads()
        if (response.success && response.data) {
          setLeads(response.data.leads || [])
        } else {
          console.error('Failed to fetch leads:', response.error)
          toast.error('Failed to load leads')
        }
      } catch (error) {
        console.error('Error fetching leads:', error)
        toast.error('Error loading leads')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchLeads()
  }, [])

  // Filter leads based on search and filters
  const filteredLeads = React.useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [leads, searchQuery, statusFilter, sourceFilter])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalLeads = leads.length
    const newLeads = leads.filter(l => l.status === 'new').length
    const contacted = leads.filter(l => l.status === 'contacted').length
    const converted = leads.filter(l => l.status === 'converted').length
    
    const avgScore = leads.reduce((sum, lead) => sum + lead.intentScore, 0) / leads.length * 100
    const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0

    return {
      total: totalLeads,
      new: newLeads,
      contacted,
      converted,
      avgScore: Math.round(avgScore),
      conversionRate: Math.round(conversionRate * 10) / 10
    }
  }, [leads])

  const handleViewLead = (lead: Lead) => {
    console.log("View lead:", lead)
    // TODO: Open lead detail modal
  }

  const handleContactLead = (lead: Lead) => {
    console.log("Contact lead:", lead)
    // TODO: Open contact modal or redirect to campaign creation
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await leadsAPI.deleteLead(leadId)
      if (response.success) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId))
        toast.success('Lead deleted successfully')
      } else {
        toast.error('Failed to delete lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Error deleting lead')
    }
  }

  const handleImportLeads = () => {
    setLoading(true)
    // Simulate import
    setTimeout(() => {
      setLoading(false)
      // TODO: Implement actual import functionality
    }, 2000)
  }

  const handleLeadsDiscovered = (newLeads: Lead[]) => {
    setLeads(prev => [...newLeads, ...prev])
    toast.success(`${newLeads.length} new leads discovered!`)
  }

  const handleDiscoverLeads = () => {
    setDiscoveryModalOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Discover, manage, and convert high-quality leads for your community.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportLeads} loading={loading}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={handleDiscoverLeads}>
            <Target className="mr-2 h-4 w-4" />
            Discover Leads
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={stats.total}
          icon={Target}
          format="number"
        />
        <StatsCard
          title="New Leads"
          value={stats.new}
          change={15.2}
          trend="up"
          icon={Users}
          format="number"
        />
        <StatsCard
          title="Avg. Intent Score"
          value={stats.avgScore}
          change={8.1}
          trend="up"
          icon={TrendingUp}
          format="percentage"
        />
        <StatsCard
          title="Conversion Rate"
          value={stats.conversionRate}
          change={-2.3}
          trend="down"
          icon={MessageSquare}
          format="percentage"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter your leads to find exactly what you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name, email, or content..."
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
                <DropdownMenuItem onClick={() => setStatusFilter("new")}>
                  New
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("contacted")}>
                  Contacted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("responded")}>
                  Responded
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("converted")}>
                  Converted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("ignored")}>
                  Ignored
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Source: {sourceFilter === "all" ? "All" : sourceFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSourceFilter("all")}>
                  All Sources
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("reddit")}>
                  Reddit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("twitter")}>
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("discord")}>
                  Discord
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("manual")}>
                  Manual
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || statusFilter !== "all" || sourceFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setSourceFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {filteredLeads.length !== leads.length && (
            <div className="mt-4">
              <Badge variant="secondary">
                Showing {filteredLeads.length} of {leads.length} leads
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Table */}
      <LeadsTable
        leads={filteredLeads}
        loading={initialLoading || loading}
        onViewLead={handleViewLead}
        onContactLead={handleContactLead}
        onDeleteLead={handleDeleteLead}
      />

      {/* Lead Discovery Modal */}
      <SimpleLeadDiscovery
        isOpen={discoveryModalOpen}
        onClose={() => setDiscoveryModalOpen(false)}
        onLeadsDiscovered={handleLeadsDiscovered}
      />
    </div>
  )
}