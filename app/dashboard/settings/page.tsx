"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Save, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dummyUser } from "@/data/dummy"

export default function SettingsPage() {
  const [showApiKeys, setShowApiKeys] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    fullName: dummyUser.fullName,
    email: dummyUser.email,
    whopCommunityName: dummyUser.whopCommunityName || '',
    whopCommunityId: dummyUser.whopCommunityId || '',
    whopApiKey: '',
    openaiApiKey: '',
    stripeSecretKey: '',
    resendApiKey: ''
  })

  const handleSave = async () => {
    setLoading(true)
    // Simulate save
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, API keys, and platform configuration.
        </p>
      </motion.div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and community details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whopCommunityName">Whop Community Name</Label>
              <Input
                id="whopCommunityName"
                placeholder="e.g., Entrepreneur Hub"
                value={formData.whopCommunityName}
                onChange={(e) => handleInputChange('whopCommunityName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whopCommunityId">Whop Company ID</Label>
              <Input
                id="whopCommunityId"
                placeholder="e.g., biz_PP48eXfUaxXYNm"
                value={formData.whopCommunityId}
                onChange={(e) => handleInputChange('whopCommunityId', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your API keys for platform integrations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Keys
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Keys
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Whop API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="whopApiKey">Whop API Key</Label>
              <Badge variant="destructive">Required</Badge>
            </div>
            <Input
              id="whopApiKey"
              type={showApiKeys ? "text" : "password"}
              placeholder="Enter your Whop API key"
              value={formData.whopApiKey}
              onChange={(e) => handleInputChange('whopApiKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from the Whop Developer Dashboard
            </p>
          </div>

          {/* OpenAI API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
              <Badge variant="destructive">Required</Badge>
            </div>
            <Input
              id="openaiApiKey"
              type={showApiKeys ? "text" : "password"}
              placeholder="sk-..."
              value={formData.openaiApiKey}
              onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for AI-powered lead analysis and personalization
            </p>
          </div>

          {/* Stripe API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
              <Badge variant="warning">Optional</Badge>
            </div>
            <Input
              id="stripeSecretKey"
              type={showApiKeys ? "text" : "password"}
              placeholder="sk_live_..."
              value={formData.stripeSecretKey}
              onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for payment processing and revenue tracking
            </p>
          </div>

          {/* Resend API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="resendApiKey">Resend API Key</Label>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <Input
              id="resendApiKey"
              type={showApiKeys ? "text" : "password"}
              placeholder="re_..."
              value={formData.resendApiKey}
              onChange={(e) => handleInputChange('resendApiKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for automated email outreach campaigns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>
            Configure how the platform behaves for your use case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead Quality Threshold</Label>
              <Input type="number" min="0" max="100" defaultValue="70" />
              <p className="text-xs text-muted-foreground">
                Minimum intent score to consider a lead (0-100)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Max Leads Per Day</Label>
              <Input type="number" min="1" max="1000" defaultValue="50" />
              <p className="text-xs text-muted-foreground">
                Maximum number of leads to discover daily
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Outreach Message Tone</Label>
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={loading}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}