'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FreetimeSchedule() {
  const [freetimes, setFreetimes] = useState(null)
  const [switchStates, setSwitchStates] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
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
            monday: data.monday,
            tuesday: data.tuesday,
            wednesday: data.wednesday,
            thursday: data.thursday,
            friday: data.friday,
            saturday: data.saturday,
            sunday: data.sunday,
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

  const handleSwitchChange = useCallback((day, checked) => {
    if (!userFreetimeId) {
      console.error('User FreeTime ID is not set.')
      return
    }

    setSwitchStates((prevState) => ({
      ...prevState,
      [day]: checked,
    }))

    axios.patch(`http://localhost:8000/match/api/user_freetimes/${userFreetimeId}/`, {
      [day]: checked
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {freetimes && Object.keys(switchStates).map((day) => {
        const dayNames = {
          monday: '月曜日',
          tuesday: '火曜日',
          wednesday: '水曜日',
          thursday: '木曜日',
          friday: '金曜日',
          saturday: '土曜日',
          sunday: '日曜日'
        }
        return (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{dayNames[day]}：{nextWeekDates[day]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span>利用可能</span>
              <Switch
                checked={switchStates[day]}
                onCheckedChange={(checked) => handleSwitchChange(day, checked)}
                className={`${
                  switchStates[day] ? 'bg-primary' : 'bg-input'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span
                  className={`${
                    switchStates[day] ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-background transition`}
                />
              </Switch>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

