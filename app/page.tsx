'use client'

import { useState, useEffect } from 'react'

interface HealthData {
  status: string
  environment: string
  database: string
  timestamp: number
  version: string
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://whop-lead-engine-production.up.railway.app'

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/health`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  const getDbStatusColor = (status: string) => {
    return status === 'connected' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 Whop Lead Engine
        </h1>
        <p className="text-xl text-gray-600">
          AI-Powered Lead Generation for Whop Communities
        </p>
      </div>

      {/* API Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">API Status</h2>
          <button 
            onClick={fetchHealth}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Status</h3>
              <p className={`text-lg font-semibold ${getStatusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Database</h3>
              <p className={`text-lg font-semibold ${getDbStatusColor(health.database)}`}>
                {health.database.toUpperCase()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Environment</h3>
              <p className="text-lg font-semibold text-blue-600">
                {health.environment.toUpperCase()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Version</h3>
              <p className="text-lg font-semibold text-gray-800">
                {health.version}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-semibold text-blue-900 mb-2">📚 API Documentation</h3>
            <p className="text-blue-700">Interactive Swagger docs for testing endpoints</p>
          </a>
          
          <a
            href={`${API_URL}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <h3 className="font-semibold text-green-900 mb-2">💚 Health Check</h3>
            <p className="text-green-700">Raw health endpoint JSON response</p>
          </a>
        </div>
      </div>

      {/* Database Status Alert */}
      {health?.database === 'disconnected' && (
        <div className="card bg-red-50 border border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-3">⚠️ Database Issue Detected</h2>
          <p className="text-red-800 mb-4">
            The API is running but the database is disconnected. This will cause authentication and data endpoints to fail.
          </p>
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-2">Fix in Railway Dashboard:</h3>
            <ol className="list-decimal list-inside text-red-800 space-y-1 text-sm">
              <li>Go to <a href="https://railway.app/dashboard" className="underline">Railway Dashboard</a></li>
              <li>Click on "whop-lead-engine-production" project</li>
              <li>Add PostgreSQL service if missing</li>
              <li>Copy DATABASE_URL from PostgreSQL variables</li>
              <li>Set it in your main service environment variables</li>
              <li>Redeploy the service</li>
            </ol>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">🎯 Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🔍 Lead Discovery</h3>
            <p className="text-purple-700 text-sm">AI-powered scraping from Reddit, Twitter, Discord</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Qualification</h3>
            <p className="text-blue-700 text-sm">GPT-4 analyzes leads with intent scoring (0-100)</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">📧 Automated Outreach</h3>
            <p className="text-green-700 text-sm">Personalized campaigns with AI-generated messages</p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">📊 Churn Prediction</h3>
            <p className="text-yellow-700 text-sm">Monitor member activity and predict churn risk</p>
          </div>
          
          <div className="p-4 bg-pink-50 rounded-lg">
            <h3 className="font-semibold text-pink-900 mb-2">💰 Revenue Management</h3>
            <p className="text-pink-700 text-sm">Stripe Connect integration with revenue sharing</p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-900 mb-2">📈 Analytics</h3>
            <p className="text-indigo-700 text-sm">Complete performance tracking and insights</p>
          </div>
        </div>
      </div>
    </div>
  )
}