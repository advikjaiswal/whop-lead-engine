"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { MoreHorizontal, Eye, MessageSquare, Trash2, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Lead, LeadStatus } from "../types";
import { cn, truncateText } from "@/lib/utils"

interface LeadsTableProps {
  leads: Lead[]
  loading?: boolean
  onViewLead?: (lead: Lead) => void
  onContactLead?: (lead: Lead) => void
  onDeleteLead?: (leadId: number) => void | Promise<void>
  className?: string
}

const getStatusVariant = (status: LeadStatus) => {
  switch (status) {
    case 'cold':
      return 'info'
    case 'warm':
      return 'warning'
    case 'hot':
      return 'success'
    default:
      return 'default'
  }
}

const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-green-600';
    if (sentiment === 'negative') return 'text-red-600';
    return 'text-gray-500';
}

const getSourceIcon = (url: string) => {
  if (url.includes('reddit.com')) return '🟠'
  if (url.includes('twitter.com')) return '🐦'
  if (url.includes('discord.com')) return '💬'
  return '📄'
}

const getSourceName = (lead: Lead) => {
  if (lead.subreddit) {
    return `r/${lead.subreddit}`
  }
  if (lead.source_url.includes('twitter.com')) {
    return 'Twitter'
  }
  if (lead.source_url.includes('discord.com')) {
    return 'Discord'
  }
  return 'Unknown'
}

export function LeadsTable({
  leads,
  loading = false,
  onViewLead,
  onContactLead,
  onDeleteLead,
  className,
}: LeadsTableProps) {
  if (loading) {
    // Skeleton loader remains the same
    return (
        <Card className={className}>
            <CardHeader><CardTitle>Loading Leads...</CardTitle></CardHeader>
            <CardContent><p>Please wait while we fetch the leads.</p></CardContent>
        </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              Manage and track your discovered leads
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {leads.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No leads found</h3>
            <p className="text-muted-foreground">
              Use the "Discover Leads" feature to find new opportunities.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="font-medium">{lead.author}</div>
                      <div className="text-sm text-muted-foreground">{truncateText(lead.title, 60)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getSourceIcon(lead.source_url)}
                        </span>
                        <span className="capitalize text-sm">
                          {getSourceName(lead)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{lead.quality_score.toFixed(1)} / 10</span>
                            <span className={cn("text-xs", getSentimentColor(lead.sentiment))}>{lead.sentiment}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <span className="text-sm capitalize">{lead.outreach_stage.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewLead?.(lead)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(lead.source_url, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Source
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteLead?.(lead.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}