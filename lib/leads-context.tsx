"use client"

import * as React from "react"
import { Lead } from "@/types"
import { leadsAPI } from "@/lib/api"
import { toast } from "sonner"

interface LeadsContextType {
  leads: Lead[]
  loading: boolean
  refreshLeads: () => Promise<void>
  addLeads: (newLeads: Lead[]) => void
  updateLead: (leadId: number, updates: Partial<Lead>) => void
  deleteLead: (leadId: number) => Promise<void>
  clearLeads: () => void
}

const LeadsContext = React.createContext<LeadsContextType | undefined>(undefined)

const CACHE_KEY = 'cached_leads'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)

  // Load leads from cache or API
  const loadLeads = React.useCallback(async () => {
    try {
      // Try to load from cache first
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached)
            // Use cache if it's still fresh
            if (Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
              setLeads(data)
              setLoading(false)
              return
            }
          } catch (e) {
            console.error('Error parsing cached data:', e)
          }
        }
      }

      // Check for auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

      if (!token) {
        setLoading(false)
        return
      }

      // Fetch from API
      const response = await leadsAPI.getLeads()

      if (response.success && response.data) {
        const fetchedLeads = response.data.leads || []
        setLeads(fetchedLeads)

        // Cache the leads
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: fetchedLeads,
            timestamp: Date.now()
          }))
        }
      } else {
        console.error('Failed to fetch leads:', response.error)
        setLeads([])
        toast.error('Failed to load leads')
      }
    } catch (error) {
      console.error('Error loading leads:', error)
      setLeads([])
      toast.error('Error loading leads')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshLeads = async () => {
    setLoading(true)
    await loadLeads()
  }

  const addLeads = (newLeads: Lead[]) => {
    setLeads(prevLeads => {
      const updatedLeads = [...newLeads, ...prevLeads]

      // Update cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: updatedLeads,
          timestamp: Date.now()
        }))
      }

      return updatedLeads
    })
  }

  const updateLead = (leadId: number, updates: Partial<Lead>) => {
    setLeads(prevLeads => {
      const updatedLeads = prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      )

      // Update cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: updatedLeads,
          timestamp: Date.now()
        }))
      }

      return updatedLeads
    })
  }

  const deleteLead = async (leadId: number) => {
    try {
      const response = await leadsAPI.deleteLead(leadId)
      if (response.success) {
        setLeads(prevLeads => {
          const updatedLeads = prevLeads.filter(lead => lead.id !== leadId)

          // Update cache
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: updatedLeads,
              timestamp: Date.now()
            }))
          }

          return updatedLeads
        })

        toast.success('Lead deleted successfully')
      } else {
        toast.error('Failed to delete lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Error deleting lead')
    }
  }

  const clearLeads = () => {
    setLeads([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY)
    }
  }

  // Load leads on mount
  React.useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const value: LeadsContextType = {
    leads,
    loading,
    refreshLeads,
    addLeads,
    updateLead,
    deleteLead,
    clearLeads
  }

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = React.useContext(LeadsContext)
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider')
  }
  return context
}