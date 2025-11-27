"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  X, 
  Send, 
  MessageSquare, 
  User,
  Copy,
  CheckCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lead } from "@/types"
import { toast } from "sonner"

interface ContactLeadModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
}

export function ContactLeadModal({ lead, isOpen, onClose }: ContactLeadModalProps) {
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (lead && isOpen) {
      // Use AI-generated personalized message if available
      const defaultSubject = lead.subreddit
        ? `Re: ${lead.title}`
        : `Regarding your post`
      
      const defaultMessage = lead.personalizedMessage || 
        `Hi ${lead.author},

I came across your post and found it really interesting. I think I might be able to help with what you're looking for.

"${lead.content.slice(0, 100)}..."

Would you be open to a quick chat about this?

Best regards`

      setSubject(defaultSubject)
      setMessage(defaultMessage)
    }
  }, [lead, isOpen])

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Message copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy message")
    }
  }

  const handleSendMessage = async () => {
    if (!lead || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    
    try {
      // Simulate sending message (you can implement actual sending logic here)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`Message prepared for ${lead.author}! Copy and send manually.`)
      onClose()
    } catch (error) {
      toast.error("Failed to prepare message")
    } finally {
      setLoading(false)
    }
  }

  const openSourcePlatform = () => {
    if (lead?.source_url) {
      window.open(lead.source_url, '_blank')
    } else {
      toast.error("Source URL not available")
    }
  }

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
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Contact Lead</h2>
              <p className="text-sm text-muted-foreground">Prepare outreach message</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {lead.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{lead.author}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {lead.subreddit || 'Unknown Source'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(lead.quality_score * 10)}% intent
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Original Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Post</CardTitle>
              <CardDescription>
                Reference content for your outreach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg text-sm">
                {lead.content}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={openSourcePlatform}
              >
                View on {lead.subreddit || 'Source'}
              </Button>
            </CardContent>
          </Card>

          {/* AI-Generated Message Notice */}
          {lead.personalizedMessage && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">AI-Powered Personalization</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This message was generated using OpenAI based on the lead's content and pain points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Composer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compose Message</CardTitle>
              <CardDescription>
                {lead.personalizedMessage 
                  ? "AI-generated personalized message (feel free to edit)" 
                  : "Craft a personalized outreach message"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject line..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your personalized message..."
                  rows={8}
                />
              </div>

              {/* Message Stats */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Characters: {message.length}</span>
                <span>Words: {message.split(' ').filter(w => w.length > 0).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">1.</span>
                  <span>Copy the message above using the button below</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">2.</span>
                  <span>Visit the original post by clicking "View on {lead.subreddit || 'Source'}"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">3.</span>
                  <span>Send a direct message or reply to the post</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">4.</span>
                  <span>Track responses in your dashboard</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCopyMessage}
                disabled={!message.trim()}
              >
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Message
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!subject.trim() || !message.trim() || loading}
              >
                {loading ? (
                  "Preparing..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Prepare & Contact
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
