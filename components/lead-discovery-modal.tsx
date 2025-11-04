"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Target, Loader2, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { leadsAPI } from "@/lib/api"
import { Lead } from "@/types"
import { toast } from "sonner"

interface LeadDiscoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadsDiscovered: (leads: Lead[]) => void
}

const NICHE_OPTIONS = [
  { value: 'trading', label: 'Trading & Finance' },
  { value: 'saas', label: 'SaaS & Development' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'marketing', label: 'Digital Marketing' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'coaching', label: 'Coaching & Consulting' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' }
]

export function LeadDiscoveryModal({ isOpen, onClose, onLeadsDiscovered }: LeadDiscoveryModalProps) {
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [selectedNiche, setSelectedNiche] = React.useState('')
  const [keywords, setKeywords] = React.useState<string[]>([])
  const [keywordInput, setKeywordInput] = React.useState('')
  const [subreddits, setSubreddits] = React.useState<string[]>([])
  const [subredditInput, setSubredditInput] = React.useState('')
  const [maxLeads, setMaxLeads] = React.useState(20)
  const [template, setTemplate] = React.useState<any>(null)
  const [discoveredLeads, setDiscoveredLeads] = React.useState<Lead[]>([])

  const resetForm = () => {
    setStep(1)
    setSelectedNiche('')
    setKeywords([])
    setKeywordInput('')
    setSubreddits([])
    setSubredditInput('')
    setMaxLeads(20)
    setTemplate(null)
    setDiscoveredLeads([])
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNicheSelect = async (niche: string) => {
    setSelectedNiche(niche)
    setLoading(true)

    try {
      const response = await leadsAPI.getCriteriaTemplate(niche)
      if (response.success && response.data) {
        setTemplate(response.data.template)
        setKeywords(response.data.template.keywords || [])
        setSubreddits(response.data.template.subreddits || [])
      }
    } catch (error) {
      console.error('Failed to load template:', error)
      toast.error('Failed to load niche template')
    } finally {
      setLoading(false)
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
        setDiscoveredLeads(response.data)
        toast.success(`Discovered ${response.data.length} new leads!`)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Discover New Leads</span>
          </DialogTitle>
          <DialogDescription>
            Use AI-powered discovery to find high-quality leads for your community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNum 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNum ? 'bg-blue-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Niche Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="niche">Select Your Community Niche</Label>
                <Select value={selectedNiche} onValueChange={handleNicheSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your niche..." />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {template && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Template Preview</CardTitle>
                    <CardDescription>
                      {template.target_demographic}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Keywords: </span>
                        <span className="text-sm text-muted-foreground">
                          {template.keywords?.slice(0, 3).join(', ')}
                          {template.keywords?.length > 3 && '...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Pain Points: </span>
                        <span className="text-sm text-muted-foreground">
                          {template.pain_points?.slice(0, 2).join(', ')}
                          {template.pain_points?.length > 2 && '...'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!selectedNiche || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Next'
                  )}
                </Button>
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
                  max="100"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(parseInt(e.target.value) || 20)}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleDiscoverLeads} disabled={keywords.length === 0}>
                  Discover Leads
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Discovering */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Discovering Leads...</h3>
                <p className="text-muted-foreground">
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
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Discovery Complete!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{discoveredLeads.length}</div>
                  <div className="text-sm text-muted-foreground">Leads Discovered</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {discoveredLeads.filter(l => l.qualityGrade === 'A' || l.qualityGrade === 'B').length}
                  </div>
                  <div className="text-sm text-muted-foreground">High Quality (A-B)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(discoveredLeads.reduce((sum, l) => sum + l.intentScore, 0) / discoveredLeads.length * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Intent Score</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {discoveredLeads.slice(0, 5).map((lead) => (
                  <Card key={lead.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-md">
                          {lead.summary || lead.content.slice(0, 100)}...
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
                  <div className="text-center text-sm text-muted-foreground">
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
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}