"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Loader2, Building } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { supabase } from "@/lib/supabase"
import type { Room } from "@/types"

export default function DisplaysDirectory() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('name', { ascending: true })
        
        if (error) throw error
        
        setRooms(data || [])
        setFilteredRooms(data || [])
      } catch (error) {
        console.error("Error fetching rooms:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRooms()
  }, [])
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(rooms)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(query) || 
        room.location.toLowerCase().includes(query)
      )
      setFilteredRooms(filtered)
    }
  }, [searchQuery, rooms])
  
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="border-b p-6">
        <h1 className="text-3xl font-bold mb-2">Conference Room Displays</h1>
        <p className="text-muted-foreground">
          Select a room to view its display
        </p>
      </header>
      
      <div className="p-6 flex-1 overflow-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="Search rooms by name or location..." 
            className="pl-10 py-6 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium">No Rooms Found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Link href={`/displays/${encodeURIComponent(room.name)}`} key={room.id}>
                <Card className="h-full cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-xl">{room.name}</CardTitle>
                      <StatusBadge status={room.status} />
                    </div>
                    <CardDescription>{room.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Capacity: {room.capacity} people
                    </p>
                    {room.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button className="w-full">View Display</Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 