"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { RightPanel } from "@/components/dashboard/right-panel"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"
import { AnalysisProvider } from "@/components/dashboard/analysis-context"
import { AuthProvider } from "@/components/dashboard/auth-context"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { FeedbackButton } from "@/components/dashboard/feedback-button"

function DashboardInner({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex flex-1 md:ml-64">
        <div className="flex-1 overflow-auto">{children}</div>
        <RightPanel />
      </main>
      <FeedbackButton />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AnalysisProvider>
          <DashboardInner>{children}</DashboardInner>
        </AnalysisProvider>
      </SidebarProvider>
    </AuthProvider>
  )
}
