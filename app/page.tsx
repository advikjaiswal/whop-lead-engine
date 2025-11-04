"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()

  React.useEffect(() => {
    // Check if user is authenticated - only run on client
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("auth_token")
      
      if (token) {
        // Redirect to dashboard if authenticated
        router.push("/dashboard")
      } else {
        // Redirect to login if not authenticated
        router.push("/login")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center text-white"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg mx-auto mb-4">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Whop Lead Engine</h1>
        <p className="text-white/80">Loading...</p>
      </motion.div>
    </div>
  )
}