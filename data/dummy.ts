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
    id: 1,
    title: "Struggling to find good mentors",
    content: 'Been struggling to find good mentors for my startup journey. Looking for a community of like-minded entrepreneurs.',
    author: 'sarahj_startup',
    source_url: 'https://reddit.com/r/entrepreneur/post/123',
    subreddit: 'entrepreneur',
    quality_score: 9.2,
    sentiment: 'positive',
    discovered_at: new Date('2024-11-01').toISOString(),
    status: 'cold',
    outreach_stage: 'not_contacted',
    personalizedMessage: "Hey Sarah, I saw your post about finding mentors. Our community is full of experienced entrepreneurs who love to help each other out. We have weekly mentorship calls and a really supportive group. I think you'd get a lot of value from it."
  },
  {
    id: 2,
    title: "Launched my SaaS, need marketing help",
    content: 'Just launched my SaaS but struggling with marketing. Any recommendations for courses or communities?',
    author: 'mikec_dev',
    source_url: 'https://twitter.com/mikec_dev/status/123',
    subreddit: 'saas',
    quality_score: 7.8,
    sentiment: 'neutral',
    discovered_at: new Date('2024-10-30').toISOString(),
    status: 'warm',
    outreach_stage: 'contacted',
  },
  {
    id: 3,
    title: "How to monetize content creation skills?",
    content: 'Looking to monetize my content creation skills. Want to learn about building digital products.',
    author: 'emily_creates',
    source_url: 'https://discord.com/channel/123/456',
    subreddit: '',
    quality_score: 6.5,
    sentiment: 'positive',
    discovered_at: new Date('2024-10-28').toISOString(),
    status: 'hot',
    outreach_stage: 'responded',
  },
  {
    id: 4,
    title: "Advice for starting a side hustle",
    content: 'Thinking about starting a side hustle while working full-time. Any advice?',
    author: 'alextech',
    source_url: 'https://reddit.com/r/sidehustle/post/456',
    subreddit: 'sidehustle',
    quality_score: 4.5,
    sentiment: 'neutral',
    discovered_at: new Date('2024-10-25').toISOString(),
    status: 'cold',
    outreach_stage: 'not_contacted',
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
  revenue_generated: 24580,
  paid_members_added: 89,
  new_leads_captured: 1247,
  warm_leads: 342,
  outreach_messages_sent: 856
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