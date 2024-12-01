'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Coffee, Hexagon, Home, Search, User, Hourglass, UserRound } from 'lucide-react'

const BottomNavigation = () => {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('/')

  useEffect(() => {
    setActiveTab(pathname || '/')
  }, [pathname])

  const navItems = [
    { path: '/boardgame', icon: Hexagon, label: '' },
    { path: '/user', icon: UserRound, label: '' },
    { path: '/cafe', icon: Coffee, label: '' },
    { path: '/freetime', icon: Hourglass, label: '' },
  ]

  return (
    <>
      {/* メインコンテンツ部分に余白を追加 */}
      <div className="pt-4 pb-16">
        {/* ここにメインコンテンツを挿入 */}
      </div>

      {/* ボトムナビバー */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              href={path}
              className={`flex flex-col items-center justify-center w-full h-full ${
                activeTab === path ? 'text-primary' : 'text-muted-foreground'
              } hover:text-primary transition-colors duration-200`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}

export default BottomNavigation