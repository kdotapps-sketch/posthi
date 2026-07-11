import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-600 font-semibold text-xl tracking-tight">
            <LayoutDashboard className="w-6 h-6" />
            <span>Posthi</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/data-deletion" className="hover:text-slate-900 transition-colors">Data Deletion</Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Posthi. All rights reserved.</p>
        <p className="mt-2">For support, contact support@posthi.app</p>
      </footer>
    </div>
  )
}
