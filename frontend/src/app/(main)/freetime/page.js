"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Sun, Moon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FreetimeSchedule() {
  const [freedays, setFreedays] = useState([])
  const [activeWeek, setActiveWeek] = useState("week1")
  const [weekDates, setWeekDates] = useState({
    week1: {},
    week2: {},
    week3: {},
    week4: {},
  })

  // Fetch free days data from the API
  useEffect(() => {
    const fetchFreeDays = async () => {
      try {
        const response = await axios.get("http://localhost:8000/match/api/user_freedays/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setFreedays(response.data)
      } catch (error) {
        console.error("Error fetching free days:", error)
      }
    }

    fetchFreeDays()
  }, [])

  // Calculate dates for the next 4 weeks
  useEffect(() => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const today = new Date()
    const nextMonday = new Date(today.getTime() + (7 - today.getDay() + 1) * 24 * 60 * 60 * 1000)

    const weeks = {}

    // Generate dates for 4 weeks
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekDates = {}
      const weekOffset = (weekNum - 1) * 7

      days.forEach((day, index) => {
        const date = new Date(nextMonday.getTime() + (weekOffset + index) * 24 * 60 * 60 * 1000)
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

        weekDates[day] = {
          display: `${date.getMonth() + 1}月${date.getDate()}日`,
          date: formattedDate,
        }
      })

      weeks[`week${weekNum}`] = weekDates
    }

    setWeekDates(weeks)
  }, [])

  // Check if a specific day and time slot is free
  const isTimeslotFree = useCallback(
    (date, timeSlot) => {
      return freedays.some((freeday) => freeday.freeday === date && freeday[timeSlot] === true)
    },
    [freedays],
  )

  // Handle switch toggle
  const handleSwitchChange = useCallback(
    async (date, timeSlot, checked) => {
      try {
        if (checked) {
          // Create new entry if checked is true
          await axios.post(
            "http://localhost:8000/match/api/user_freedays/",
            {
              freeday: date,
              [timeSlot]: true,
              [timeSlot === "daytime" ? "nighttime" : "daytime"]: false, // Set the other timeslot to false by default
              
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          )
        } else {
          // Find the entry to delete
          const existingEntry = freedays.find((freeday) => freeday.freeday === date && freeday[timeSlot] === true)

          if (existingEntry) {
            // Delete the entry
            await axios.delete(`http://localhost:8000/match/api/user_freedays/${existingEntry.id}/`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
          }
        }

        // Refresh data after update
        const response = await axios.get("http://localhost:8000/match/api/user_freedays/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setFreedays(response.data)
      } catch (error) {
        console.error("Error updating free days:", error)
        console.error("Error details:", error.response?.data)
        // Revert the UI state in case of error
        const updatedFreedays = [...freedays]
        setFreedays(updatedFreedays)
      }
    },
    [freedays],
  )

  const dayNames = {
    monday: "月曜日",
    tuesday: "火曜日",
    wednesday: "水曜日",
    thursday: "木曜日",
    friday: "金曜日",
    saturday: "土曜日",
    sunday: "日曜日",
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="week1" value={activeWeek} onValueChange={setActiveWeek} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="week1">第1週</TabsTrigger>
          <TabsTrigger value="week2">第2週</TabsTrigger>
          <TabsTrigger value="week3">第3週</TabsTrigger>
          <TabsTrigger value="week4">第4週</TabsTrigger>
        </TabsList>

        {Object.keys(weekDates).map((week) => (
          <TabsContent key={week} value={week} className="space-y-4">
            {days.map((day) => {
              const dateInfo = weekDates[week]?.[day] || {}
              return (
                <div key={`${week}-${day}`} className="grid grid-cols-2 gap-4">
                  {/* Daytime Card */}
                  <Card className="bg-background hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-lg font-semibold">{dayNames[day]}</span>
                          <span className="text-sm text-muted-foreground">{dateInfo.display}</span>
                        </div>
                        <Sun className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium">13:00 ~ 18:00</span>
                        <Switch
                          checked={isTimeslotFree(dateInfo.date, "daytime")}
                          onCheckedChange={(checked) => handleSwitchChange(dateInfo.date, "daytime", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nighttime Card */}
                  <Card className="bg-background hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-lg font-semibold">{dayNames[day]}</span>
                          <span className="text-sm text-muted-foreground">{dateInfo.display}</span>
                        </div>
                        <Moon className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium">18:00 ~ 23:00</span>
                        <Switch
                          checked={isTimeslotFree(dateInfo.date, "nighttime")}
                          onCheckedChange={(checked) => handleSwitchChange(dateInfo.date, "nighttime", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

