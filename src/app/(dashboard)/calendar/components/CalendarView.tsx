'use client'

import { useState, useEffect } from 'react'
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, 
  addMonths, subMonths, isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Film } from 'lucide-react'
import { getCalendarPosts, CalendarPost } from '../actions'

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true)
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      // We pad the fetching by a week on either side to cover grid overlap
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

      try {
        const data = await getCalendarPosts(gridStart.toISOString(), gridEnd.toISOString())
        setPosts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadPosts()
  }, [currentDate])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "d"
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />}
          <button 
            onClick={prevMonth}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 bg-slate-200 gap-[1px]">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isCurrentDay = isToday(day)
          const dayPosts = posts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day))

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] bg-white p-2 transition-colors ${
                !isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'text-slate-700'
              } hover:bg-slate-50`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isCurrentDay ? 'bg-indigo-500 text-white shadow-sm' : ''
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>
              
              <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayPosts.map(post => {
                  const hasImage = post.post_media?.some(m => m.media_assets?.media_type === 'image')
                  const hasVideo = post.post_media?.some(m => m.media_assets?.media_type === 'video')
                  
                  return (
                    <div 
                      key={post.id} 
                      className={`text-xs p-1.5 rounded border leading-tight truncate cursor-pointer hover:shadow-sm transition-shadow ${
                        post.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' :
                        post.status === 'failed' ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-indigo-50 border-indigo-100 text-indigo-700'
                      }`}
                      title={post.caption}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold uppercase text-[10px] opacity-80">{format(new Date(post.scheduled_at!), 'HH:mm')}</span>
                        <div className="flex gap-0.5">
                          {hasImage && <ImageIcon className="w-3 h-3 opacity-60" />}
                          {hasVideo && <Film className="w-3 h-3 opacity-60" />}
                        </div>
                      </div>
                      <div className="truncate">{post.caption}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
