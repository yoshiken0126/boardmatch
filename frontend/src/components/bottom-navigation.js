"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Coffee, Hexagon, Hourglass, UserRound, Shrink } from "lucide-react"
import { getToken } from "@/lib/auth"
import axios from "axios"
import { getApiBaseUrl } from "@/lib/apiConfig"

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
    cafeName: ` ${reservation.cafe_name}`,
    date: reservation.start_time,
    timeSlot: formatTimeSlot(reservation.start_time, reservation.end_time),
    numberOfPeople: reservation.count,
    participants: reservation.participants,
    gameClassName: reservation.game_class_name,
  }
}

const BottomNavigation = () => {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("/")
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false)
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState("")
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    setActiveTab(pathname || "/")
  }, [pathname])

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = getToken()
        // スラッシュの重複を避けるためにURLを適切に構築
        const url = apiBaseUrl.endsWith("/")
          ? `${apiBaseUrl}cafes/api/reservations/`
          : `${apiBaseUrl}/cafes/api/reservations/`

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log(response)

        // APIレスポンスから予約データを整形
        if (response?.data) {
          const formattedReservations = response.data
            .filter((reservation) => reservation.is_active)
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
  }, [apiBaseUrl])

  // メニューを閉じるための関数
  const closeMenu = () => {
    setIsReservationMenuOpen(false)
  }

  // クリックイベントのハンドラーを設定
  useEffect(() => {
    const handleClickOutside = (event) => {
      // メニューボタンのクリックは無視
      if (event.target.closest("button[data-reservation-button]")) {
        return
      }

      // メニュー以外の場所をクリックした場合、メニューを閉じる
      if (!event.target.closest("[data-reservation-menu]")) {
        closeMenu()
      }
    }

    if (isReservationMenuOpen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isReservationMenuOpen])

  const handleLinkClick = () => {
    if (isReservationMenuOpen) {
      setIsReservationMenuOpen(false)
    }
  }

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
    onClick: (e) => {
      e.stopPropagation() // イベントの伝播を停止
      setIsReservationMenuOpen(!isReservationMenuOpen)
    },
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
              onClick={handleLinkClick}
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
              data-reservation-button
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
        <div
          data-reservation-menu
          className="fixed bottom-16 left-0 right-0 bg-background border-t border-border z-20 p-4 max-h-[60vh] overflow-y-auto"
        >
          <h3 className="text-lg font-semibold mb-4">予約一覧</h3>
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            reservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/reservation/${reservation.id}`}
                onClick={handleLinkClick}
                className="block py-3 px-4 hover:bg-accent rounded-md mb-3 transition-colors duration-200"
              >
                <div className="text-base font-medium mb-1">{reservation.cafeName}</div>
                <div className="text-sm text-muted-foreground">
                  <span>
                    {formatDate(reservation.date)}
                    <span className="mx-2"> </span>
                    {reservation.timeSlot}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex justify-between items-center mt-1">
                  <span>
                    {reservation.gameClassName ? reservation.gameClassName : "参加者"}:
                    {reservation.participants.map((p) => p.user).join(", ")}
                  </span>
                  <span className="text-primary">予約人数 {reservation.numberOfPeople}人</span>
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

