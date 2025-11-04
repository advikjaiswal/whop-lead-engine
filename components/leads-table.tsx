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
import { Lead } from "@/types"
import { cn, truncateText, generateGradient } from "@/lib/utils"

interface LeadsTableProps {
  leads: Lead[]
  loading?: boolean
  onViewLead?: (lead: Lead) => void
  onContactLead?: (lead: Lead) => void
  onDeleteLead?: (leadId: string) => void
  className?: string
}

const getStatusVariant = (status: Lead['status']) => {
  switch (status) {
    case 'new':
      return 'info'
    case 'contacted':
      return 'warning'
    case 'responded':
      return 'secondary'
    case 'converted':
      return 'success'
    case 'ignored':
      return 'outline'
    case 'unqualified':
      return 'destructive'
    default:
      return 'default'
  }
}

const getGradeColor = (grade: Lead['qualityGrade']) => {
  switch (grade) {
    case 'A':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    case 'B':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
    case 'C':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'D':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

const getSourceIcon = (source: Lead['source']) => {
  switch (source) {
    case 'reddit':
      return '🟠'
    case 'twitter':
      return '🐦'
    case 'discord':
      return '💬'
    case 'manual':
      return '✋'
    default:
      return '📄'
  }
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
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              👥
            </div>
            <h3 className="text-lg font-medium mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              Start by importing leads or running a discovery campaign
            </p>
            <Button>Import Leads</Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content</TableHead>
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
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium",
                            `bg-gradient-to-br ${generateGradient(lead.name)}`
                          )}
                        >
                          {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          {lead.email && (
                            <p className="text-sm text-muted-foreground">
                              {lead.email}
                            </p>
                          )}
                          {lead.username && (
                            <p className="text-sm text-muted-foreground">
                              @{lead.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getSourceIcon(lead.source)}
                        </span>
                        <span className="capitalize text-sm">
                          {lead.source}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lead.intentScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(lead.intentScore * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          getGradeColor(lead.qualityGrade)
                        )}
                      >
                        {lead.qualityGrade}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(lead.status)}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {truncateText(lead.content, 80)}
                      </p>
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
                          <DropdownMenuItem onClick={() => onContactLead?.(lead)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Lead
                          </DropdownMenuItem>
                          {lead.url && (
                            <DropdownMenuItem
                              onClick={() => window.open(lead.url, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Source
                            </DropdownMenuItem>
                          )}
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