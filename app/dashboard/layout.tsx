"use client"

import * as React from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation */}
        <Navbar />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}