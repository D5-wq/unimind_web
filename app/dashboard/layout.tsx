import { Sidebar } from "@/components/dashboard/sidebar"
import { RightPanel } from "@/components/dashboard/right-panel"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"
import { AnalysisProvider } from "@/components/dashboard/analysis-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AnalysisProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex flex-1 md:ml-64">
            <div className="flex-1 overflow-auto">{children}</div>
            <RightPanel />
          </main>
        </div>
      </AnalysisProvider>
    </SidebarProvider>
  )
}
