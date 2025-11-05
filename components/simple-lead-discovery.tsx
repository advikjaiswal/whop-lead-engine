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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative glass border-white/20 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Discover New Leads</h2>
              <p className="text-sm text-white/80">AI-powered Reddit lead discovery</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white/60 hover:text-white hover:bg-white/10">
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
                <h3 className="text-lg font-medium text-white mb-4">Select Your Community Niche</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NICHE_OPTIONS.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNicheSelect(option.value)}
                      className="p-4 text-left border border-white/20 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                    >
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-white/60 mt-1">
                        {option.keywords.slice(0, 3).join(', ')}
                      </div>
                    </motion.button>
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
                <h3 className="text-lg font-medium text-white">Configure Discovery Criteria</h3>
                <Button variant="outline" onClick={() => setStep(1)} className="border-white/20 text-white hover:bg-white/10">
                  Back
                </Button>
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <Label className="text-white">Target Keywords</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button onClick={addKeyword} size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge 
                      key={keyword} 
                      variant="secondary" 
                      className="cursor-pointer bg-white/20 text-white hover:bg-white/30 border-white/30" 
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subreddits */}
              <div className="space-y-3">
                <Label className="text-white">Target Subreddits</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter subreddit name..."
                    value={subredditInput}
                    onChange={(e) => setSubredditInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubreddit()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button onClick={addSubreddit} size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subreddits.map((subreddit) => (
                    <Badge 
                      key={subreddit} 
                      variant="outline" 
                      className="cursor-pointer border-white/30 text-white hover:bg-white/20" 
                      onClick={() => removeSubreddit(subreddit)}
                    >
                      r/{subreddit} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Max Leads */}
              <div className="space-y-3">
                <Label htmlFor="maxLeads" className="text-white">Maximum Leads to Discover</Label>
                <Input
                  id="maxLeads"
                  type="number"
                  min="1"
                  max="50"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(parseInt(e.target.value) || 10)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              <Button 
                onClick={handleDiscoverLeads} 
                disabled={keywords.length === 0} 
                className="w-full bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
              >
                Discover Leads
              </Button>
            </motion.div>
          )}

          {/* Step 3: Discovering */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-12"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Discovering Leads...</h3>
                <p className="text-white/80 mt-2">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <span className="font-medium text-white">Discovery Complete!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass border-white/20 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white">{discoveredLeads.length}</div>
                  <div className="text-sm text-white/80">Leads Discovered</div>
                </div>
                <div className="glass border-white/20 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {discoveredLeads.filter(l => l.qualityGrade === 'A' || l.qualityGrade === 'B').length}
                  </div>
                  <div className="text-sm text-white/80">High Quality (A-B)</div>
                </div>
                <div className="glass border-white/20 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(discoveredLeads.reduce((sum, l) => sum + l.intentScore, 0) / discoveredLeads.length * 100) || 0}%
                  </div>
                  <div className="text-sm text-white/80">Avg. Intent Score</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3">
                {discoveredLeads.slice(0, 5).map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass border-white/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{lead.name}</div>
                          <div className="text-sm text-white/70 truncate">
                            {lead.summary || lead.content.slice(0, 100)}...
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Badge className={
                            lead.qualityGrade === 'A' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            lead.qualityGrade === 'B' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-white/20 text-white/80 border-white/30'
                          }>
                            {lead.qualityGrade}
                          </Badge>
                          <Badge className="bg-white/20 text-white/80 border-white/30">
                            {Math.round(lead.intentScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {discoveredLeads.length > 5 && (
                  <div className="text-center text-sm text-white/80">
                    +{discoveredLeads.length - 5} more leads...
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="border-white/20 text-white hover:bg-white/10">
                  Discover More
                </Button>
                <Button onClick={handleFinish} className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
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