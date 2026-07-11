import Link from 'next/link'
import {
  CalendarDays,
  Layers,
  Zap,
  Shield,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

// Platform icons as inline SVGs (Twitter/X and Instagram removed from lucide-react)
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Posthi</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-indigo-100">
            <Zap size={14} className="text-indigo-500" />
            Private-first social media scheduler
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Plan, schedule,{' '}
            <span className="gradient-text">and post smarter.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Posthi is your private content command center. Bulk schedule posts,
            manage your media library, and publish to X and Instagram — all in one clean,
            focused tool.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-200/50 text-base"
            >
              Start for free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 text-base shadow-sm"
            >
              Sign in
            </Link>
          </div>

          {/* Platform indicators */}
          <div className="flex items-center justify-center gap-4 mt-10 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <XIcon size={14} />
              <span>X / Twitter</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <InstagramIcon size={14} />
              <span>Instagram</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>+ more coming</span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/80 border border-slate-100">
            {/* Mock dashboard screenshot */}
            <div className="bg-slate-50 h-[420px] sm:h-[520px] flex items-stretch">
              {/* Sidebar preview */}
              <div className="w-48 bg-white border-r border-slate-100 p-4 flex flex-col gap-1 hidden sm:flex">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <span className="font-bold text-sm text-slate-800">Posthi</span>
                </div>
                {['Dashboard', 'Create Post', 'Bulk Schedule', 'Calendar', 'Media Library'].map((item) => (
                  <div
                    key={item}
                    className={`text-xs px-3 py-2 rounded-lg font-medium ${
                      item === 'Dashboard'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content preview */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-36 bg-slate-100 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-28 bg-indigo-500 rounded-lg" />
                    <div className="h-8 w-28 bg-violet-100 rounded-lg" />
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Scheduled', value: '12', color: 'indigo' },
                    { label: 'Due Today', value: '3', color: 'amber' },
                    { label: 'Published', value: '48', color: 'emerald' },
                    { label: 'Failed', value: '1', color: 'red' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Post rows */}
                <div className="space-y-2">
                  {[
                    { text: 'Exciting news about our product launch...', platform: 'X', status: 'scheduled', time: 'Today 2:00pm' },
                    { text: 'Behind the scenes of our creative process...', platform: 'IG', status: 'published', time: 'Yesterday' },
                    { text: 'Weekly roundup of tips and insights...', platform: 'X + IG', status: 'draft', time: 'Jul 15, 9am' },
                  ].map((post, i) => (
                    <div key={i} className="bg-white rounded-lg px-3 py-2 border border-slate-100 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-700 font-medium truncate">{post.text}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{post.time}</div>
                      </div>
                      <div className="text-xs text-slate-500 hidden sm:block">{post.platform}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.status === 'scheduled' ? 'bg-indigo-50 text-indigo-600' :
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {post.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to stay consistent
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              From bulk importing posts to a media library and publishing logs — Posthi has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: 'Bulk Schedule',
                desc: 'Upload a CSV and schedule dozens of posts at once. Validate, preview, and import in seconds.',
                color: 'indigo',
              },
              {
                icon: CalendarDays,
                title: 'Content Calendar',
                desc: 'See your entire content plan in a beautiful monthly calendar view. Drag to reschedule.',
                color: 'violet',
              },
              {
                icon: BarChart3,
                title: 'Media Library',
                desc: 'Upload, organise, and reuse your images and videos across any post.',
                color: 'purple',
              },
              {
                icon: Zap,
                title: 'Smart Composer',
                desc: 'Write captions, pick platforms, add media, and preview your post before it goes live.',
                color: 'indigo',
              },
              {
                icon: Shield,
                title: 'Hashtag Sets',
                desc: 'Save your favourite hashtag groups and apply them instantly while creating posts.',
                color: 'violet',
              },
              {
                icon: CheckCircle2,
                title: 'Publishing Logs',
                desc: 'See every publish attempt, its status, and retry failed posts with one click.',
                color: 'purple',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    feature.color === 'indigo'
                      ? 'bg-indigo-50 text-indigo-600'
                      : feature.color === 'violet'
                      ? 'bg-violet-50 text-violet-600'
                      : 'bg-purple-50 text-purple-600'
                  }`}
                >
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-900 text-base mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl blur-2xl opacity-20 scale-105" />
            <div className="relative bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl p-10 text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Take control of your content.
              </h2>
              <p className="text-indigo-100 text-lg mb-8">
                Stop manually posting every day. Plan weeks ahead in minutes.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-base"
              >
                Get started free
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600" />
            <span className="font-bold text-slate-800">Posthi</span>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Posthi. Built for creators.
          </p>
          <div className="flex gap-4 text-sm text-slate-400">
            <Link href="/login" className="hover:text-slate-600 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-slate-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
