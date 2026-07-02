"use client"

import { useEffect, useState } from "react"
import { formatDateSafe } from "@/lib/date-utils"

interface EventItem {
  id: string
  title?: string
  bannerImage?: string
  date?: string
  time?: string
  location?: string
  description?: string
  published?: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events")
        if (!res.ok) throw new Error("Failed to fetch events")
        
        const json = await res.json()
        console.log("API Response:", json) // Debug: Log API response
        
        // Handle response structure (data or nested data)
        let eventData = json
        if (json && json.data) {
          eventData = json.data
          if (eventData && eventData.data) {
            eventData = eventData.data
          }
        }
        
        if (Array.isArray(eventData)) {
          // Ensure: Only published events are shown
          const publishedEvents = eventData.filter((e: any) => e.published !== false)
          
          const formattedEvents = publishedEvents.map((item: any) => {
            const attrs = item.attributes || item.data || item
            return {
              id: item.id || Math.random().toString(),
              title: attrs.title || attrs.name || "Untitled Event",
              bannerImage: attrs.bannerImage || attrs.image || attrs.banner || null,
              date: attrs.date || null,
              time: attrs.time || null,
              location: attrs.location || null,
              description: attrs.description || attrs.summary || null,
              published: item.published ?? attrs.published ?? true
            }
          })
          setEvents(formattedEvents)
        } else {
          setEvents([])
        }
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Failed to load events. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 flex justify-center items-center min-h-[40vh]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Events</h1>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-block">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="space-y-4 mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Events</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and register for upcoming events, workshops, and webinars.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-lg">
          <h3 className="text-2xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">Please check back later for new events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="group flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md">
              {event.bannerImage ? (
                <div className="aspect-video w-full overflow-hidden relative">
                  <img 
                    src={event.bannerImage} 
                    alt={event.title} 
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image available</span>
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 line-clamp-2">{event.title}</h3>
                
                {(event.date || event.time || event.location) && (
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    {(event.date || event.time) && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>
                        <span>{formatDateSafe(event.date)} {event.time && `at ${event.time}`}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {event.description && (
                  <p className="text-muted-foreground line-clamp-3 mb-4 flex-grow">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
