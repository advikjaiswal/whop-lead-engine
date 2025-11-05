import { APIResponse, Lead, Campaign, Member, Analytics, DashboardStats } from '@/types'

// API configuration - use Railway production backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://whop-lead-engine-production.up.railway.app'

// Validate API URL
if (!API_BASE_URL) {
  console.warn('API_BASE_URL is not configured. API calls may fail.')
}

class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'APIError'
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Add auth token if available (only on client side)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }
  
  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      throw new APIError(data.error || 'API request failed', response.status)
    }
    
    return {
      success: true,
      data: data.data || data,
      message: data.message
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    return apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  
  async signup(data: {
    email: string
    password: string
    fullName: string
    whopCommunityName?: string
  }) {
    // Use simple-signup endpoint with form data
    const formData = new URLSearchParams()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('full_name', data.fullName)
    
    return apiRequest<{ access_token: string; user: any }>('/simple-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
  },
  
  async logout() {
    localStorage.removeItem('auth_token')
    return { success: true }
  },
  
  async getProfile() {
    return apiRequest<any>('/api/auth/me')
  },
  
  async updateProfile(data: any) {
    return apiRequest<any>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
}

// Leads API
export const leadsAPI = {
  async getLeads(filters?: {
    source?: string
    status?: string
    qualityGrade?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<{ leads: Lead[]; total: number }>(`/api/leads${query}`)
  },
  
  async createLead(data: Partial<Lead>) {
    return apiRequest<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async updateLead(id: string, data: Partial<Lead>) {
    return apiRequest<Lead>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  async deleteLead(id: string) {
    return apiRequest<void>(`/api/leads/${id}`, {
      method: 'DELETE'
    })
  },
  
  async discoverLeads(criteria: {
    niche: string
    keywords: string[]
    subreddits?: string[]
    maxLeads?: number
  }) {
    return apiRequest<Lead[]>('/api/leads/discover', {
      method: 'POST',
      body: JSON.stringify(criteria)
    })
  },
  
  async getCriteriaTemplate(niche: string) {
    return apiRequest<{
      niche: string
      template: {
        keywords: string[]
        subreddits: string[]
        pain_points: string[]
        target_demographic: string
      }
    }>(`/api/leads/criteria/templates/${niche}`, {
      method: 'POST'
    })
  },
  
  async analyzeLeads(data: {
    keywords: string[]
    sources: string[]
    maxLeads: number
  }) {
    return apiRequest<{ jobId: string }>('/api/leads/analyze', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async getAnalysisStatus(jobId: string) {
    return apiRequest<{ status: string; progress: number; results?: Lead[] }>(`/api/leads/analyze/${jobId}`)
  }
}

// Campaigns API
export const campaignsAPI = {
  async getCampaigns() {
    return apiRequest<Campaign[]>('/api/outreach/campaigns')
  },
  
  async createCampaign(data: Partial<Campaign>) {
    return apiRequest<Campaign>('/api/outreach/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async updateCampaign(id: string, data: Partial<Campaign>) {
    return apiRequest<Campaign>(`/api/outreach/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  async sendCampaign(id: string, leadIds: string[]) {
    return apiRequest<{ sent: number }>(`/api/outreach/campaigns/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ leadIds })
    })
  },
  
  async getCampaignAnalytics(id: string) {
    return apiRequest<any>(`/api/outreach/campaigns/${id}/analytics`)
  }
}

// Members API
export const membersAPI = {
  async getMembers(filters?: {
    status?: string
    churnRisk?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<{ members: Member[]; total: number }>(`/api/members${query}`)
  },
  
  async syncMembers() {
    return apiRequest<{ synced: number }>('/api/members/sync')
  },
  
  async sendRetentionCampaign(memberIds: string[], message: string) {
    return apiRequest<{ sent: number }>('/api/members/retention', {
      method: 'POST',
      body: JSON.stringify({ memberIds, message })
    })
  },
  
  async getMemberAnalytics() {
    return apiRequest<any>('/api/members/analytics')
  }
}

// Analytics API
export const analyticsAPI = {
  async getDashboardStats() {
    return apiRequest<DashboardStats>('/api/analytics/dashboard')
  },
  
  async getLeadAnalytics(period: string = '30d') {
    return apiRequest<any>(`/api/analytics/leads?period=${period}`)
  },
  
  async getRevenueAnalytics(period: string = '30d') {
    return apiRequest<any>(`/api/analytics/revenue?period=${period}`)
  },
  
  async getActivityFeed(limit: number = 10) {
    return apiRequest<any>(`/api/analytics/activity?limit=${limit}`)
  }
}

// Health check
export const healthAPI = {
  async check() {
    return apiRequest<{
      status: string
      database: string
      environment: string
      timestamp: number
      version: string
    }>('/health')
  }
}

// Export error class for handling
export { APIError }