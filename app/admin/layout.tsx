import { AuthProvider } from "@/components/dashboard/auth-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
