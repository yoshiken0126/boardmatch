"use client"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Blocks, ChevronDown } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { Switch } from "@/components/ui/switch"
import { getToken } from "@/lib/auth"

// Update the UserDropdown component to use the fetched user data
function UserDropdown({ userData, logout }) {
  if (!userData) return null

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData.profile_picture} alt={userData.username} />
            <AvatarFallback>{userData.username[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>プロフィール</DropdownMenuItem>
        <DropdownMenuItem>設定</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>ログアウト</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Update the main Navbar component
export default function Navbar() {
  const [userData, setUserData] = useState(null)
  const [isOptimizeActive, setIsOptimizeActive] = useState(false)
  const { logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [reservations, setReservations] = useState([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(true)
  const router = useRouter()

  const getUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("トークンがありません")
        return
      }

      // トークンからユーザーIDを取得
      const userId = JSON.parse(atob(token.split(".")[1])).user_id
      console.log("User ID:", userId)

      const response = await axios.get(`http://localhost:8000/match/api/user_info/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 200) {
        const userData = response.data
        console.log("取得したユーザーデータ:", userData)
        setUserData(userData)
        setIsOptimizeActive(userData.is_optimize_active)
      } else {
        console.error("ユーザー情報の取得に失敗しました", response)
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗しました:", error)
    }
  }, [])

  const handleSwitchChange = async (checked) => {
    try {
      const token = localStorage.getItem("token")
      const userId = JSON.parse(atob(token.split(".")[1])).user_id
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const response = await axios.patch(
        `http://localhost:8000/match/api/user_info/${userId}/`,
        { is_optimize_active: checked },
        config,
      )

      if (response.status === 200) {
        console.log("ユーザーの最適化設定が更新されました")
        setIsOptimizeActive(checked)
      } else {
        console.error("ユーザーの最適化設定の更新に失敗しました")
      }
    } catch (error) {
      console.error("ユーザーの最適化設定の更新に失敗しました:", error)
    }
  }

  const handleJoin = async (reservationId) => {
    try {
      const token = getToken()
      const response = await axios.post(
        `http://localhost:8000/match/api/participants/${reservationId}/add_participant/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (response.status === 200) {
        // Refresh the reservations list
        fetchReservations()
        // Navigate to the reservation page
        router.push(`/reservation/${reservationId}/`)
      }
    } catch (error) {
      // エラーメッセージを表示
      const errorMessage = error.response?.data?.message || "予約参加に失敗しました"
      console.error(errorMessage)
      // ここでユーザーにエラーメッセージを表示する処理を追加
    }
  }

  const fetchReservations = useCallback(() => {
    // ナビバーの表示を遅らせないよう、状態を即座に更新
    setIsLoadingReservations(true)

    // 非同期処理を開始するが、完了を待たない
    const fetchData = async () => {
      try {
        const token = getToken()
        const response = await axios.get("http://localhost:8000/match/api/participants/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setReservations(response.data)
        setIsLoadingReservations(false)
        console.log(response)
      } catch (error) {
        console.error("予約情報の取得に失敗しました:", error)
        setIsLoadingReservations(false)
      }
    }

    // 非同期処理を開始
    fetchData()
  }, [])

  useEffect(() => {
    getUserInfo()
    fetchReservations()
  }, [getUserInfo, fetchReservations])

  // ゲーム情報を取得して表示用にフォーマットする関数
  const getGameInfo = (reservation) => {
    const cafeGames = reservation.cafe_games || []
    const userGames = reservation.user_games || []
    const allGames = [...cafeGames, ...userGames]

    if (allGames.length === 0) {
      return "未定"
    }

    return allGames
      .map((game) => {
        const gameName = game.name || "不明なゲーム"
        const instructorInfo = game.instructor_name ? `（説明者: ${game.instructor_name}）` : ""

        return `${gameName}${instructorInfo}`
      })
      .join(", ")
  }

  // 日本語の曜日を取得する関数
  const getJapaneseDayOfWeek = (date) => {
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]
    return `(${dayOfWeek})`
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
                    <span className="text-primary">卓</span>
                    <span className="text-gray-500 italic">match</span>
                    <Blocks className="h-6 w-6 ml-1" />
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Link>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel>募集中の予約</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isLoadingReservations ? (
                    <div className="py-2 px-2 text-center">
                      <span className="text-sm text-gray-500">読み込み中...</span>
                    </div>
                  ) : reservations.filter((r) => r.is_recruiting).length > 0 ? (
                    reservations
                      .filter((r) => r.is_recruiting)
                      .map((reservation) => {
                        const startDate = new Date(reservation.start_time)
                        const endDate = new Date(reservation.end_time)
                        return (
                          <DropdownMenuItem key={reservation.id} className="flex flex-col items-start">
                            <div className="flex flex-col w-full">
                              <span className="text-sm">
                                日時：{startDate.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                                {getJapaneseDayOfWeek(startDate)}　
                                {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}～
                                {endDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="text-sm">カフェ：{reservation.cafe_name}</span>
                              <span className="text-sm">ゲーム：{getGameInfo(reservation)}</span>
                              <span className="text-sm">
                                募集人数：{reservation.max_participants - reservation.count}人
                              </span>
                              <Button
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleJoin(reservation.id)
                                }}
                                className="mt-2 w-full"
                                variant="outline"
                              >
                                参加する
                              </Button>
                            </div>
                          </DropdownMenuItem>
                        )
                      })
                  ) : (
                    <div className="py-2 px-2 text-center">
                      <span className="text-sm text-gray-500">現在募集中の予約はありません</span>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {userData ? (
              <span className="text-sm font-medium text-gray-700">
                {isOptimizeActive ? `${userData.username}さんは卓待ち中です` : `ようこそ、${userData.username}さん`}
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-700">ローディング中...</span>
            )}
            {userData && <UserDropdown userData={userData} logout={logout} />}
          </div>

          <div className="flex items-center space-x-4">
            <div className="ml-4">
              <Switch
                checked={isOptimizeActive}
                onCheckedChange={handleSwitchChange}
                className={`${
                  isOptimizeActive ? "bg-black" : "bg-gray-200"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">最適化機能を有効にする</span>
                <span
                  className={`${
                    isOptimizeActive ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </Switch>
            </div>
            <div className="flex items-center sm:hidden">
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">メニューを開く</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userData && (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={userData.profile_picture} alt={userData.username} />
                            <AvatarFallback>{userData.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{userData.username}</p>
                            <p className="text-xs text-gray-500">{isOptimizeActive ? "卓待ち中" : userData.email}</p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuItem>プロフィール</DropdownMenuItem>
                      <DropdownMenuItem>設定</DropdownMenuItem>
                      <DropdownMenuItem onClick={logout}>ログアウト</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}



