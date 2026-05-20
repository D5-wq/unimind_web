import { Sidebar } from "@/components/dashboard/sidebar"
import { RightPanel } from "@/components/dashboard/right-panel"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 flex flex-1">
        <div className="flex-1 overflow-auto">{children}</div>
        <RightPanel />
      </main>
    </div>
  )
}
