"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Coffee, Hexagon, Hourglass, UserRound, Shrink } from "lucide-react"

// 日付をフォーマットする関数
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]
  return `${month}月${day}日(${dayOfWeek})`
}

// モックデータ（numberOfPeopleフィールドを追加）
const mockReservations = [
  { id: 1, cafeName: "Meeple Cafe", date: "2025-02-15", timeSlot: "19:00-22:00", numberOfPeople: 4 },
  { id: 2, cafeName: "Study Boards", date: "2025-02-18", timeSlot: "14:00-17:00", numberOfPeople: 2 },
  { id: 3, cafeName: "Dice & Coffee", date: "2025-02-20", timeSlot: "18:00-21:00", numberOfPeople: 3 },
]

const BottomNavigation = ({ reservations = mockReservations }) => {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("/")
  const [isReservationMenuOpen, setIsReservationMenuOpen] = useState(false)

  useEffect(() => {
    setActiveTab(pathname || "/")
  }, [pathname])

  // 基本のナビゲーションアイテム
  const navItems = [
    { path: "/boardgame", icon: Hexagon, label: "" },
    { path: "/user", icon: UserRound, label: "" },
    { path: "/cafe", icon: Coffee, label: "" },
    { path: "/freetime", icon: Hourglass, label: "" },
  ]

  // 予約メニューアイテムを作成
  const reservationItem = {
    path: "#",
    icon: Shrink,
    label: "",
    onClick: () => setIsReservationMenuOpen(!isReservationMenuOpen),
  }

  return (
    <>
      {/* メインコンテンツ部分に余白を追加 */}
      <div className="pt-4 pb-16">{/* ここにメインコンテンツを挿入 */}</div>

      {/* ボトムナビゲーションバー */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }, index) => (
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

      {/* 予約メニュー */}
      {isReservationMenuOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border z-20 p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">予約一覧</h3>
          {reservations.map((reservation) => (
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
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export default BottomNavigation
