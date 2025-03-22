"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/app/context/AuthContext"
import axios from "axios"
import { getApiBaseUrl } from "@/lib/apiConfig"

const navigationItems = [
  { name: "予約", href: "/reservations" },
  { name: "売上", href: "/reservations" },
  { name: "勤務予定", href: "/" },
  { name: "マイページ", href: "/mypage" },
]

export default function NavigationBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const pathname = usePathname()
  const { logout } = useAuth()
  const apiBaseUrl = getApiBaseUrl()

  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("トークンがありません")
        return
      }

      const userId = JSON.parse(atob(token.split(".")[1])).user_id
      console.log("User ID:", userId)

      // スラッシュの重複を避けるためにURLを適切に構築
      const url = apiBaseUrl.endsWith("/")
        ? `${apiBaseUrl}cafes/api/staff_info/${userId}/`
        : `${apiBaseUrl}/cafes/api/staff_info/${userId}/`

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 200) {
        const userData = response.data
        console.log("取得したユーザーデータ:", userData)
        setUserData(userData)
      } else {
        console.error("ユーザー情報の取得に失敗しました", response)
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗しました:", error)
    }
  }

  const handleLogout = () => {
    logout()
  }

  useEffect(() => {
    getUserInfo()
  }, [apiBaseUrl]) // apiBaseUrlが変更された場合に再取得

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Coffee className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                {userData ? userData.cafe_name : "ローディング中..."}
              </span>
            </Link>
            <span className="ml-3 text-sm font-medium text-gray-700">
              ようこそ、{userData ? userData.username : "ローディング中..."}さん
            </span>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === item.href
                    ? "border-primary text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
          <div className="flex items-center sm:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <span className="sr-only">メニューを開く</span>
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:max-w-none">
                <div className="mt-6 flow-root">
                  <div className="mb-4 px-3 py-2 text-sm font-medium text-gray-700">
                    {userData ? `ようこそ、${userData.username}さん` : ""}
                  </div>
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                          pathname === item.href
                            ? "bg-gray-50 text-primary"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

