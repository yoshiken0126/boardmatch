"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Coffee, Hexagon, Hourglass, UserRound, Shrink } from "lucide-react"
import { getToken } from "@/lib/auth"
import axios from "axios"

// 日付と時間をフォーマットする関数
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]
  return `${month}月${day}日(${dayOfWeek})`
}

const formatTimeSlot = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${start.getHours()}:00-${end.getHours()}:00`
}

const formatReservation = (reservation) => {
  return {
    id: reservation.id,
    cafeName: ` ${reservation.cafe_name}`, // カフェ名はAPIから取得する必要があります
    date: reservation.start_time,
    timeSlot: formatTimeSlot(reservation.start_time, reservation.end_time),
    numberOfPeople: reservation.count,
    participants: reservation.participants
  }
}

const BottomNavigation = () => {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("/")
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false)
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    setActiveTab(pathname || "/")
  }, [pathname])

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = getToken()
        const response = await axios.get("http://localhost:8000/cafes/api/reservations/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        // APIレスポンスから予約データを整形
        if (response?.data) {
          const formattedReservations = response.data
            .filter(reservation => reservation.is_active)
            .map(formatReservation)
          
          setReservations(formattedReservations)
        } else {
          setError("予約データの形式が不正です。")
        }
      } catch (err) {
        console.error("Error fetching reservations:", err)
        setError("予約情報の取得に失敗しました。")
      }
    }

    fetchReservations()
  }, [])

  // 基本のナビゲーションアイテム
  const navItems = [
    { path: "/boardgame", icon: Hexagon, label: "" },
    { path: "/user", icon: UserRound, label: "" },
    { path: "/cafe", icon: Coffee, label: "" },
    { path: "/freetime", icon: Hourglass, label: "" },
  ]

  // 予約メニューアイテム
  const reservationItem = {
    path: "#",
    icon: Shrink,
    label: "",
    onClick: () => setIsReservationMenuOpen(!isReservationMenuOpen),
  }

  return (
    <>
      <div className="pt-4 pb-16" />

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              href={path}
              className={`flex flex-col items-center justify-center w-full h-full ${
                activeTab === path ? "text-primary" : "text-muted-foreground"
              } hover:text-primary transition-colors duration-200`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
          {reservations.length > 0 && (
            <button
              onClick={reservationItem.onClick}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isReservationMenuOpen ? "text-primary" : "text-muted-foreground"
              } hover:text-primary transition-colors duration-200`}
            >
              <reservationItem.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{reservationItem.label}</span>
            </button>
          )}
        </div>
      </nav>

      {isReservationMenuOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border z-20 p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">予約一覧</h3>
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            reservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/reservation/${reservation.id}`}
                className="block py-3 px-4 hover:bg-accent rounded-md mb-3 transition-colors duration-200"
              >
                <div className="text-base font-medium mb-1">{reservation.cafeName}</div>
                <div className="text-sm text-muted-foreground flex justify-between items-center">
                  <span>
                    {formatDate(reservation.date)}
                    <span className="mx-2"> </span>
                    {reservation.timeSlot}
                  </span>
                  <span className="text-primary">予約人数 {reservation.numberOfPeople}人</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  参加者: {reservation.participants.map(p => p.user).join(", ")}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </>
  )
}

export default BottomNavigation