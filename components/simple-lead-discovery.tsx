"use client"

import * as React from "react"
import { motion } from "framer-motion"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Discover New Leads</h2>
              <p className="text-sm text-muted-foreground">AI-powered Reddit lead discovery</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Step 1: Niche Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium mb-4">Select Your Community Niche</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {NICHE_OPTIONS.map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50"
                        onClick={() => handleNicheSelect(option.value)}
                      >
                        <CardContent className="p-4">
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground mt-2">
                            {option.keywords.slice(0, 3).join(', ')}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Criteria Configuration */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configure Discovery Criteria</h3>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Parameters</CardTitle>
                  <CardDescription>
                    Configure keywords and subreddits to find the most relevant leads
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Keywords */}
                  <div className="space-y-3">
                    <Label>Target Keywords</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter keyword..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button onClick={addKeyword} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <Badge 
                          key={keyword} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80" 
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Subreddits */}
                  <div className="space-y-3">
                    <Label>Target Subreddits</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter subreddit name..."
                        value={subredditInput}
                        onChange={(e) => setSubredditInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubreddit()}
                      />
                      <Button onClick={addSubreddit} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subreddits.map((subreddit) => (
                        <Badge 
                          key={subreddit} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted" 
                          onClick={() => removeSubreddit(subreddit)}
                        >
                          r/{subreddit} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Max Leads */}
                  <div className="space-y-3">
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

                  <Button 
                    onClick={handleDiscoverLeads} 
                    disabled={keywords.length === 0} 
                    className="w-full"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Discover Leads
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Discovering */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-12"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Discovering Leads...</h3>
                <p className="text-muted-foreground mt-2">
                  Searching Reddit for potential leads matching your criteria
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-lg">Discovery Complete!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold">{discoveredLeads.length}</div>
                    <div className="text-sm text-muted-foreground">Leads Discovered</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-green-600">
                      {discoveredLeads.filter(l => l.qualityGrade === 'A' || l.qualityGrade === 'B').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Quality (A-B)</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(discoveredLeads.reduce((sum, l) => sum + l.intentScore, 0) / discoveredLeads.length * 100) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Intent Score</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Discovered Leads</CardTitle>
                  <CardDescription>
                    Preview of the leads found matching your criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {discoveredLeads.slice(0, 5).map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
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
                      </motion.div>
                    ))}
                    {discoveredLeads.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{discoveredLeads.length - 5} more leads...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Discover More
                </Button>
                <Button onClick={handleFinish}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Add Leads to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}