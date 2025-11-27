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
import { LeadDetailModal } from "@/components/lead-detail-modal"
import { ContactLeadModal } from "@/components/contact-lead-modal"
import { Lead } from "@/types"
import { useLeads } from "@/lib/leads-context"

export default function LeadsPage() {
  const { leads, loading: initialLoading, addLeads, deleteLead } = useLeads()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(false)
  const [discoveryModalOpen, setDiscoveryModalOpen] = React.useState(false)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [leadDetailModalOpen, setLeadDetailModalOpen] = React.useState(false)
  const [contactModalOpen, setContactModalOpen] = React.useState(false)

  // No need to fetch leads manually - the context handles this

  // Filter leads based on search and filters
  const filteredLeads = React.useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesSource = sourceFilter === "all" || lead.subreddit === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [leads, searchQuery, statusFilter, sourceFilter])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalLeads = leads.length
    const warmLeads = leads.filter(l => l.status === 'warm').length
    const hotLeads = leads.filter(l => l.status === 'hot').length
    
    const avgScore = totalLeads > 0 
      ? (leads.reduce((sum, lead) => sum + (lead.quality_score || 0), 0) / totalLeads)
      : 0
    
    const conversionRate = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100 * 10) / 10 : 0

    return {
      total: totalLeads,
      warm: warmLeads,
      hot: hotLeads,
      avgScore: avgScore,
      conversionRate
    }
  }, [leads])

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadDetailModalOpen(true)
  }

  const handleContactLead = (lead: Lead) => {
    setSelectedLead(lead)
    setContactModalOpen(true)
  }

  const handleDeleteLead = async (leadId: number) => {
    await deleteLead(leadId)
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
    addLeads(newLeads)
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
          title="Warm Leads"
          value={stats.warm}
          icon={TrendingUp}
          format="number"
        />
        <StatsCard
          title="Hot Leads (Converted)"
          value={stats.hot}
          icon={Users}
          format="number"
        />
        <StatsCard
          title="Avg. Quality Score"
          value={Math.round(stats.avgScore * 10) / 10}
          icon={MessageSquare}
          format="number"
          suffix="/ 10"
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
                  placeholder="Search by author, title, or content..."
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
                <DropdownMenuItem onClick={() => setStatusFilter("cold")}>
                  Cold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("warm")}>
                  Warm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("hot")}>
                  Hot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Source filter can be improved later to dynamically get subreddits */}
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
                <DropdownMenuItem onClick={() => setSourceFilter("entrepreneur")}>
                  r/entrepreneur
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("business")}>
                  r/business
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

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={leadDetailModalOpen}
        onClose={() => {
          setLeadDetailModalOpen(false)
          setSelectedLead(null)
        }}
        onContact={handleContactLead}
      />

      {/* Contact Lead Modal */}
      <ContactLeadModal
        lead={selectedLead}
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false)
          setSelectedLead(null)
        }}
      />
    </div>
  )
}