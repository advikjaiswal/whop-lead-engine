"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  Users,
  MessageSquare,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Target,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarItem } from "@/types"
import { useLeads } from "@/lib/leads-context"

interface SidebarProps {
  className?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    id: "leads",
    label: "Leads",
    href: "/dashboard/leads",
    icon: Target,
    // badge removed, will be added dynamically
  },
  {
    id: "messaging",
    label: "Messaging",
    href: "/dashboard/messaging",
    icon: MessageSquare,
  },
  {
    id: "retention",
    label: "Retention",
    href: "/dashboard/retention",
    icon: Users,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    id: "revenue",
    label: "Revenue",
    href: "/dashboard/revenue",
    icon: CreditCard,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings/workspace",
    icon: Settings,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const { leads } = useLeads()

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={cn(
        "relative flex h-screen flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isCollapsed ? "w-[60px]" : "w-[280px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Whop Lead Engine
            </span>
          </motion.div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-2 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            // Dynamic badge logic
            let badge = item.badge
            if (item.id === "leads" && leads.length > 0) {
              badge = leads.length.toString()
            }

            return (
              <Link key={item.id} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  {/* Active indicator - positioned at the left edge */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                      transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                    />
                  )}

                  <Icon className={cn("h-4 w-4 flex-shrink-0 relative z-10")} />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 relative z-10">{item.label}</span>

                      {badge && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white text-[10px] relative z-10"
                        >
                          {badge}
                        </motion.span>
                      )}
                    </>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t p-4"
        >
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Premium Plan</p>
                <p className="text-xs text-muted-foreground">Unlimited leads</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}