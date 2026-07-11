import { CalendarView } from './components/CalendarView'

export const metadata = {
  title: 'Calendar | Posthi',
  description: 'View your scheduled social media posts',
}

export default function CalendarPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calendar</h1>
        <p className="text-slate-500 mt-2">
          Get a bird&apos;s-eye view of your content schedule.
        </p>
      </div>

      <CalendarView />
    </div>
  )
}
