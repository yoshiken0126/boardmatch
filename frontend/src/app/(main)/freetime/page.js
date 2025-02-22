'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

export default function FreetimeSchedule() {
  const [freetimes, setFreetimes] = useState(null)
  const [switchStates, setSwitchStates] = useState({
    monday_daytime: false, monday_nighttime: false,
    tuesday_daytime: false, tuesday_nighttime: false,
    wednesday_daytime: false, wednesday_nighttime: false,
    thursday_daytime: false, thursday_nighttime: false,
    friday_daytime: false, friday_nighttime: false,
    saturday_daytime: false, saturday_nighttime: false,
    sunday_daytime: false, sunday_nighttime: false
  })
  const [userFreetimeId, setUserFreetimeId] = useState(null)
  const [nextWeekDates, setNextWeekDates] = useState({})

  useEffect(() => {
    const fetchFreetimes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/match/api/user_freetimes/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        })
        if (response.data.length > 0) {
          const data = response.data[0]
          setFreetimes(data)
          setUserFreetimeId(data.id)
          setSwitchStates({
            monday_daytime: data.monday_daytime,
            monday_nighttime: data.monday_nighttime,
            tuesday_daytime: data.tuesday_daytime,
            tuesday_nighttime: data.tuesday_nighttime,
            wednesday_daytime: data.wednesday_daytime,
            wednesday_nighttime: data.wednesday_nighttime,
            thursday_daytime: data.thursday_daytime,
            thursday_nighttime: data.thursday_nighttime,
            friday_daytime: data.friday_daytime,
            friday_nighttime: data.friday_nighttime,
            saturday_daytime: data.saturday_daytime,
            saturday_nighttime: data.saturday_nighttime,
            sunday_daytime: data.sunday_daytime,
            sunday_nighttime: data.sunday_nighttime
          })
        }
      } catch (error) {
        console.error('Error fetching freetimes:', error)
      }
    }

    fetchFreetimes()
  }, [])

  useEffect(() => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const today = new Date()
    const nextMonday = new Date(today.getTime() + (7 - today.getDay() + 1) * 24 * 60 * 60 * 1000)
    const nextWeek = {}

    days.forEach((day, index) => {
      const nextDate = new Date(nextMonday.getTime() + index * 24 * 60 * 60 * 1000)
      nextWeek[day] = `${nextDate.getMonth() + 1}月${nextDate.getDate()}日`
    })

    setNextWeekDates(nextWeek)
  }, [])

  const handleSwitchChange = useCallback((day, time, checked) => {
    if (!userFreetimeId) {
      console.error('User FreeTime ID is not set.')
      return
    }

    const field = `${day}_${time}`

    setSwitchStates((prevState) => ({
      ...prevState,
      [field]: checked,
    }))

    axios.patch(`http://localhost:8000/match/api/user_freetimes/${userFreetimeId}/`, {
      [field]: checked
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
    .then(response => {
      console.log('Update successful:', response.data)
    })
    .catch(error => {
      console.error('Error updating freetime:', error)
    })
  }, [userFreetimeId])

  const dayNames = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日'
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="max-w-4xl mx-auto">
      {days.map(day => (
        <div key={day} className="grid grid-cols-2 gap-4">
          {/* Daytime Card */}
          <Card className="bg-background">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="font-medium">
                  {dayNames[day]}：{nextWeekDates[day]}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">昼 13:00~18:00 で利用可能</span>
                  <Switch
                    checked={switchStates[`${day}_daytime`]}
                    onCheckedChange={(checked) => handleSwitchChange(day, 'daytime', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nighttime Card */}
          <Card className="bg-background">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="font-medium">
                  {dayNames[day]}：{nextWeekDates[day]}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">夜 18:00~23:00 で利用可能</span>
                  <Switch
                    checked={switchStates[`${day}_nighttime`]}
                    onCheckedChange={(checked) => handleSwitchChange(day, 'nighttime', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}