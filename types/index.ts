export interface User {
  id: string
  email: string
  fullName: string
  whopCommunityName?: string
  whopCommunityId?: string
  whopApiKey?: string
  createdAt: Date
  updatedAt: Date
}

export interface Lead {
  id: string
  name: string
  email?: string
  username?: string
  source: LeadSource
  content: string
  url?: string
  intentScore: number
  qualityGrade: 'A' | 'B' | 'C' | 'D'
  status: LeadStatus
  interests: string[]
  painPoints: string[]
  summary: string
  personalizationData?: {
    recommendedApproach: string
    keyTalkingPoints: string[]
    urgencyLevel: 'low' | 'medium' | 'high'
  }
  createdAt: Date
  updatedAt: Date
}

export type LeadSource = 'reddit' | 'twitter' | 'discord' | 'manual'
export type LeadStatus = 'new' | 'contacted' | 'responded' | 'converted' | 'ignored' | 'unqualified'

export interface Campaign {
  id: string
  name: string
  messageTemplate: string
  subjectTemplate?: string
  personalizationEnabled: boolean
  status: CampaignStatus
  leadIds: string[]
  sentCount: number
  openRate: number
  responseRate: number
  conversionRate: number
  createdAt: Date
  updatedAt: Date
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface Member {
  id: string
  whopMemberId: string
  email?: string
  username?: string
  fullName?: string
  status: MemberStatus
  tier?: string
  monthlyRevenue?: number
  lastLogin?: Date
  lastMessage?: Date
  totalMessages: number
  engagementScore: number
  churnRisk: 'low' | 'medium' | 'high'
  joinedAt: Date
  updatedAt: Date
}

export type MemberStatus = 'active' | 'inactive' | 'churned' | 'at_risk'

export interface Analytics {
  totalLeads: number
  leadsThisWeek: number
  totalConversions: number
  conversionsThisWeek: number
  conversionRate: number
  totalRevenue: number
  revenueThisMonth: number
  activeMembers: number
  churnedMembers: number
  retentionRate: number
}

export interface DashboardStats {
  leadsGenerated: {
    total: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  conversions: {
    total: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  revenue: {
    total: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  retention: {
    rate: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
}

export interface ActivityFeedItem {
  id: string
  type: 'lead_generated' | 'lead_converted' | 'campaign_sent' | 'member_joined' | 'member_churned'
  title: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ChartData {
  name: string
  value: number
  date?: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Toast {
  id: string
  title?: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon: any
  badge?: string | number
  isActive?: boolean
}

export interface Modal {
  id: string
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}