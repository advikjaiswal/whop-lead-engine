"use client"

import * as React from "react"
import { Target, Loader2, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { leadsAPI } from "@/lib/api"
import { Lead } from "@/types"
import { toast } from "sonner"

interface SimpleLeadDiscoveryProps {
  isOpen: boolean
  onClose: () => void
  onLeadsDiscovered: (leads: Lead[]) => void
}

const NICHE_OPTIONS = [
  { value: 'trading', label: 'Trading & Finance', keywords: ['trading', 'stocks', 'investment'], subreddits: ['investing', 'trading', 'stocks'] },
  { value: 'saas', label: 'SaaS & Development', keywords: ['SaaS', 'software', 'startup'], subreddits: ['entrepreneur', 'startups', 'SaaS'] },
  { value: 'fitness', label: 'Fitness & Health', keywords: ['fitness', 'gym', 'workout'], subreddits: ['fitness', 'bodybuilding', 'loseit'] },
  { value: 'marketing', label: 'Digital Marketing', keywords: ['marketing', 'advertising', 'SEO'], subreddits: ['marketing', 'entrepreneur', 'digital_marketing'] },
  { value: 'ecommerce', label: 'E-commerce', keywords: ['ecommerce', 'shopify', 'amazon'], subreddits: ['ecommerce', 'entrepreneur', 'shopify'] },
  { value: 'coaching', label: 'Coaching & Consulting', keywords: ['coaching', 'consulting', 'mentor'], subreddits: ['entrepreneur', 'coaching', 'consulting'] },
  { value: 'crypto', label: 'Cryptocurrency', keywords: ['crypto', 'bitcoin', 'ethereum'], subreddits: ['cryptocurrency', 'bitcoin', 'ethereum'] },
  { value: 'gaming', label: 'Gaming', keywords: ['gaming', 'game development', 'streaming'], subreddits: ['gaming', 'gamedev', 'indiegaming'] },
  { value: 'education', label: 'Education', keywords: ['education', 'learning', 'course'], subreddits: ['education', 'teachers', 'college'] },
  { value: 'realestate', label: 'Real Estate', keywords: ['real estate', 'property', 'investment'], subreddits: ['realestate', 'realestateinvesting', 'landlord'] }
]

export function SimpleLeadDiscovery({ isOpen, onClose, onLeadsDiscovered }: SimpleLeadDiscoveryProps) {
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [selectedNiche, setSelectedNiche] = React.useState('')
  const [keywords, setKeywords] = React.useState<string[]>([])
  const [keywordInput, setKeywordInput] = React.useState('')
  const [subreddits, setSubreddits] = React.useState<string[]>([])
  const [subredditInput, setSubredditInput] = React.useState('')
  const [maxLeads, setMaxLeads] = React.useState(10)
  const [discoveredLeads, setDiscoveredLeads] = React.useState<Lead[]>([])

  const resetForm = () => {
    setStep(1)
    setSelectedNiche('')
    setKeywords([])
    setKeywordInput('')
    setSubreddits([])
    setSubredditInput('')
    setMaxLeads(10)
    setDiscoveredLeads([])
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNicheSelect = (niche: string) => {
    const selected = NICHE_OPTIONS.find(opt => opt.value === niche)
    if (selected) {
      setSelectedNiche(niche)
      setKeywords(selected.keywords)
      setSubreddits(selected.subreddits)
      setStep(2)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const addSubreddit = () => {
    if (subredditInput.trim() && !subreddits.includes(subredditInput.trim())) {
      setSubreddits([...subreddits, subredditInput.trim()])
      setSubredditInput('')
    }
  }

  const removeSubreddit = (subreddit: string) => {
    setSubreddits(subreddits.filter(s => s !== subreddit))
  }

  const handleDiscoverLeads = async () => {
    if (keywords.length === 0) {
      toast.error('Please add at least one keyword')
      return
    }

    setLoading(true)
    setStep(3)

    try {
      const criteria = {
        niche: selectedNiche,
        keywords,
        subreddits,
        maxLeads
      }

      const response = await leadsAPI.discoverLeads(criteria)
      
      if (response.success && response.data) {
        // Transform API response to Lead objects
        const transformedLeads = response.data.map((apiLead: any, index: number) => ({
          id: apiLead.id?.toString() || `discovered-${Date.now()}-${index}`,
          name: apiLead.author || 'Unknown User',
          email: undefined,
          username: apiLead.author,
          source: 'reddit' as const,
          content: apiLead.content || apiLead.title || '',
          url: apiLead.source_url,
          intentScore: apiLead.quality_score || 0,
          qualityGrade: (apiLead.quality_score >= 0.7 ? 'A' : 
                        apiLead.quality_score >= 0.5 ? 'B' : 
                        apiLead.quality_score >= 0.3 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D',
          status: 'new' as const,
          interests: keywords,
          painPoints: [],
          summary: apiLead.title || apiLead.content?.slice(0, 150) + '...',
          createdAt: new Date(apiLead.discovered_at || Date.now()),
          updatedAt: new Date(apiLead.discovered_at || Date.now())
        }))
        
        setDiscoveredLeads(transformedLeads)
        toast.success(`Discovered ${transformedLeads.length} new leads!`)
        setStep(4)
      } else {
        throw new Error(response.error || 'Failed to discover leads')
      }
    } catch (error) {
      console.error('Lead discovery failed:', error)
      toast.error('Failed to discover leads')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onLeadsDiscovered(discoveredLeads)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Discover New Leads</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Step 1: Niche Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Your Community Niche</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NICHE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleNicheSelect(option.value)}
                      className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {option.keywords.slice(0, 3).join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Criteria Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configure Discovery Criteria</h3>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Target Keywords</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button onClick={addKeyword} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subreddits */}
              <div className="space-y-2">
                <Label>Target Subreddits</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter subreddit name..."
                    value={subredditInput}
                    onChange={(e) => setSubredditInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubreddit()}
                  />
                  <Button onClick={addSubreddit} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subreddits.map((subreddit) => (
                    <Badge key={subreddit} variant="outline" className="cursor-pointer" onClick={() => removeSubreddit(subreddit)}>
                      r/{subreddit} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Max Leads */}
              <div className="space-y-2">
                <Label htmlFor="maxLeads">Maximum Leads to Discover</Label>
                <Input
                  id="maxLeads"
                  type="number"
                  min="1"
                  max="50"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(parseInt(e.target.value) || 10)}
                />
              </div>

              <Button onClick={handleDiscoverLeads} disabled={keywords.length === 0} className="w-full">
                Discover Leads
              </Button>
            </div>
          )}

          {/* Step 3: Discovering */}
          {step === 3 && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Discovering Leads...</h3>
                <p className="text-gray-600">
                  Searching Reddit for potential leads matching your criteria
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Discovery Complete!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{discoveredLeads.length}</div>
                  <div className="text-sm text-gray-600">Leads Discovered</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {discoveredLeads.filter(l => l.qualityGrade === 'A' || l.qualityGrade === 'B').length}
                  </div>
                  <div className="text-sm text-gray-600">High Quality (A-B)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(discoveredLeads.reduce((sum, l) => sum + l.intentScore, 0) / discoveredLeads.length * 100) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Avg. Intent Score</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {discoveredLeads.slice(0, 5).map((lead) => (
                  <Card key={lead.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {lead.summary || lead.content.slice(0, 100)}...
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Badge variant={
                          lead.qualityGrade === 'A' ? 'default' :
                          lead.qualityGrade === 'B' ? 'secondary' :
                          'outline'
                        }>
                          {lead.qualityGrade}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(lead.intentScore * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                {discoveredLeads.length > 5 && (
                  <div className="text-center text-sm text-gray-600">
                    +{discoveredLeads.length - 5} more leads...
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Discover More
                </Button>
                <Button onClick={handleFinish}>
                  Add Leads to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}