"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  X, 
  ExternalLink, 
  User, 
  MessageSquare, 
  Calendar,
  Star
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Lead } from "@/types"
import { cn } from "@/lib/utils"

interface LeadDetailModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onContact: (lead: Lead) => void
}

const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (sentiment === 'negative') return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
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

export function LeadDetailModal({ lead, isOpen, onClose, onContact }: LeadDetailModalProps) {
  if (!isOpen || !lead) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Lead Details</h2>
              <p className="text-sm text-muted-foreground">View complete lead information</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {lead.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{lead.author}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                  getSentimentColor(lead.sentiment)
                )}
              >
                <Star className="h-3 w-3 mr-1" />
                {lead.sentiment}
              </span>
              <Badge variant="secondary">
                {lead.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Lead Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lead.quality_score.toFixed(1)} / 10
                </div>
                <div className="text-sm text-muted-foreground">Quality Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold flex items-center justify-center">
                  <span className="text-lg mr-1">{getSourceIcon(lead.source_url)}</span>
                  {getSourceName(lead)}
                </div>
                <div className="text-sm text-muted-foreground">Source</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {lead.outreach_stage.replace('_', ' ')}
                </div>
                <div className="text-sm text-muted-foreground">Outreach Stage</div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Original Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{lead.content}</p>
              </div>
              {lead.source_url && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(lead.source_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Generated Personalized Message */}
          {lead.personalizedMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  AI-Generated Personalized Message
                </CardTitle>
                <CardDescription>
                  Copy and paste this message to reach out to the lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {lead.personalizedMessage}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.personalizedMessage!)
                      // Could add a toast here
                    }}
                  >
                    📋 Copy Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Title */}
          {lead.title && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Title</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lead.title}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discovered</span>
                  <span>{new Date(lead.discovered_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onContact(lead)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Lead
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
