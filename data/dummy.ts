import { Lead, Campaign, Member, DashboardStats, ActivityFeedItem, ChartData } from '@/types'

export const dummyUser = {
  id: '1',
  email: 'john@example.com',
  fullName: 'John Doe',
  whopCommunityName: 'Entrepreneur Hub',
  whopCommunityId: 'biz_PP48eXfUaxXYNm',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date()
}

export const dummyLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    username: 'sarahj_startup',
    source: 'reddit',
    content: 'Been struggling to find good mentors for my startup journey. Looking for a community of like-minded entrepreneurs.',
    url: 'https://reddit.com/r/entrepreneur/post/123',
    intentScore: 0.92,
    qualityGrade: 'A',
    status: 'new',
    interests: ['startup', 'mentorship', 'networking'],
    painPoints: ['lack of guidance', 'isolation', 'decision making'],
    summary: 'High-intent founder actively seeking community and mentorship',
    personalizationData: {
      recommendedApproach: 'Focus on mentorship and community aspects',
      keyTalkingPoints: ['experienced founders', 'weekly mentorship calls', 'supportive community'],
      urgencyLevel: 'high'
    },
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    username: 'mikec_dev',
    source: 'twitter',
    content: 'Just launched my SaaS but struggling with marketing. Any recommendations for courses or communities?',
    url: 'https://twitter.com/mikec_dev/status/123',
    intentScore: 0.78,
    qualityGrade: 'B',
    status: 'contacted',
    interests: ['saas', 'marketing', 'growth'],
    painPoints: ['marketing knowledge gap', 'customer acquisition'],
    summary: 'SaaS founder needing marketing guidance and community support',
    personalizationData: {
      recommendedApproach: 'Highlight marketing expertise and success stories',
      keyTalkingPoints: ['marketing playbooks', 'growth strategies', 'case studies'],
      urgencyLevel: 'medium'
    },
    createdAt: new Date('2024-10-30'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    username: 'emily_creates',
    source: 'discord',
    content: 'Looking to monetize my content creation skills. Want to learn about building digital products.',
    intentScore: 0.65,
    qualityGrade: 'B',
    status: 'responded',
    interests: ['content creation', 'digital products', 'monetization'],
    painPoints: ['monetization strategies', 'product development'],
    summary: 'Content creator exploring digital product opportunities',
    personalizationData: {
      recommendedApproach: 'Focus on creator economy and digital products',
      keyTalkingPoints: ['creator success stories', 'product development', 'monetization'],
      urgencyLevel: 'medium'
    },
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date('2024-10-31')
  },
  {
    id: '4',
    name: 'Alex Thompson',
    email: 'alex@example.com',
    username: 'alextech',
    source: 'reddit',
    content: 'Thinking about starting a side hustle while working full-time. Any advice?',
    intentScore: 0.45,
    qualityGrade: 'C',
    status: 'new',
    interests: ['side hustle', 'work-life balance'],
    painPoints: ['time management', 'getting started'],
    summary: 'Early-stage interest in entrepreneurship, still exploring',
    personalizationData: {
      recommendedApproach: 'Educational content and beginner-friendly approach',
      keyTalkingPoints: ['side hustle success', 'time management', 'beginner resources'],
      urgencyLevel: 'low'
    },
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-10-25')
  }
]

export const dummyCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q4 Outreach Campaign',
    messageTemplate: 'Hi {name}, I noticed your interest in {topic}. Our community would be perfect for you!',
    subjectTemplate: 'Perfect fit for {whop_community_name}',
    personalizationEnabled: true,
    status: 'active',
    leadIds: ['1', '2', '3'],
    sentCount: 25,
    openRate: 0.68,
    responseRate: 0.24,
    conversionRate: 0.08,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: '2',
    name: 'High-Intent Founders',
    messageTemplate: 'Hello {name}, I saw your post about {pain_point}. I think you\'d love our founder community.',
    personalizationEnabled: true,
    status: 'completed',
    leadIds: ['1', '4'],
    sentCount: 12,
    openRate: 0.83,
    responseRate: 0.42,
    conversionRate: 0.17,
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-10-01')
  }
]

export const dummyMembers: Member[] = [
  {
    id: '1',
    whopMemberId: 'whop_001',
    email: 'member1@example.com',
    username: 'successful_founder',
    fullName: 'Jessica Williams',
    status: 'active',
    tier: 'Premium',
    monthlyRevenue: 299,
    lastLogin: new Date('2024-11-01'),
    lastMessage: new Date('2024-10-31'),
    totalMessages: 45,
    engagementScore: 0.92,
    churnRisk: 'low',
    joinedAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: '2',
    whopMemberId: 'whop_002',
    email: 'member2@example.com',
    username: 'startup_guy',
    fullName: 'David Kim',
    status: 'active',
    tier: 'Basic',
    monthlyRevenue: 99,
    lastLogin: new Date('2024-10-28'),
    lastMessage: new Date('2024-10-20'),
    totalMessages: 12,
    engagementScore: 0.45,
    churnRisk: 'medium',
    joinedAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-10-28')
  },
  {
    id: '3',
    whopMemberId: 'whop_003',
    username: 'quiet_member',
    fullName: 'Lisa Chen',
    status: 'inactive',
    tier: 'Premium',
    monthlyRevenue: 299,
    lastLogin: new Date('2024-10-10'),
    lastMessage: new Date('2024-09-15'),
    totalMessages: 3,
    engagementScore: 0.15,
    churnRisk: 'high',
    joinedAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-10-10')
  }
]

export const dummyDashboardStats: DashboardStats = {
  leadsGenerated: {
    total: 1247,
    change: 12.5,
    trend: 'up'
  },
  conversions: {
    total: 89,
    change: 8.3,
    trend: 'up'
  },
  revenue: {
    total: 24580,
    change: -2.1,
    trend: 'down'
  },
  retention: {
    rate: 92.5,
    change: 3.2,
    trend: 'up'
  }
}

export const dummyActivityFeed: ActivityFeedItem[] = [
  {
    id: '1',
    type: 'lead_generated',
    title: 'New lead discovered',
    description: 'Sarah Johnson from Reddit shows high intent (92%)',
    timestamp: new Date('2024-11-01T10:30:00'),
    metadata: { leadId: '1', source: 'reddit' }
  },
  {
    id: '2',
    type: 'lead_converted',
    title: 'Lead converted',
    description: 'Mike Chen joined the Premium tier',
    timestamp: new Date('2024-11-01T09:15:00'),
    metadata: { leadId: '2', tier: 'Premium' }
  },
  {
    id: '3',
    type: 'campaign_sent',
    title: 'Campaign sent',
    description: 'Q4 Outreach Campaign sent to 25 leads',
    timestamp: new Date('2024-11-01T08:00:00'),
    metadata: { campaignId: '1', count: 25 }
  },
  {
    id: '4',
    type: 'member_joined',
    title: 'New member',
    description: 'Emily Rodriguez joined the community',
    timestamp: new Date('2024-10-31T16:45:00'),
    metadata: { memberId: '3' }
  }
]

export const dummyChartData: ChartData[] = [
  { name: 'Jan', value: 850, date: '2024-01' },
  { name: 'Feb', value: 920, date: '2024-02' },
  { name: 'Mar', value: 1100, date: '2024-03' },
  { name: 'Apr', value: 980, date: '2024-04' },
  { name: 'May', value: 1250, date: '2024-05' },
  { name: 'Jun', value: 1380, date: '2024-06' },
  { name: 'Jul', value: 1420, date: '2024-07' },
  { name: 'Aug', value: 1650, date: '2024-08' },
  { name: 'Sep', value: 1580, date: '2024-09' },
  { name: 'Oct', value: 1720, date: '2024-10' },
  { name: 'Nov', value: 1850, date: '2024-11' }
]

export const dummyRevenueData: ChartData[] = [
  { name: 'Jan', value: 12450 },
  { name: 'Feb', value: 13200 },
  { name: 'Mar', value: 15800 },
  { name: 'Apr', value: 14200 },
  { name: 'May', value: 18900 },
  { name: 'Jun', value: 21300 },
  { name: 'Jul', value: 19800 },
  { name: 'Aug', value: 23400 },
  { name: 'Sep', value: 22100 },
  { name: 'Oct', value: 25600 },
  { name: 'Nov', value: 24580 }
]