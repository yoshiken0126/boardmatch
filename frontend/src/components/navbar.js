'use client';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { Switch } from "@/components/ui/switch";

// ユーザードロップダウンコンポーネント
function UserDropdown({ user }) {
  if (!user) return null;

  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem>
          設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// メインのナビゲーションバーコンポーネント
export default function Navbar() {
  const [userData, setUserData] = useState(null);
  const [isOptimizeActive, setIsOptimizeActive] = useState(false); // 初期状態

  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('トークンがありません');
        return;
      }

      // トークンからユーザーIDを取得
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      const response = await axios.get(`http://localhost:8000/match/api/user_info/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;
      setUserData(userData);
      setIsOptimizeActive(userData.is_optimize_active); // 初期状態として設定
      console.log(userData);
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
    }
  };

  const handleSwitchChange = async (checked) => {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.patch(
        `http://localhost:8000/match/api/user_info/${userId}/`,
        { is_optimize_active: checked },
        config
      );

      if (response.status === 200) {
        console.log('ユーザーの最適化設定が更新されました');
        setIsOptimizeActive(checked);
      } else {
        console.error('ユーザーの最適化設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('ユーザーの最適化設定の更新に失敗しました:', error);
    }
  };

  useEffect(() => {
    getUserInfo(); // 初期データの取得
  }, []);

  const user = {
    name: '山田太郎',
    email: 'taro@example.com',
    image: 'https://github.com/shadcn.png',
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                ロゴ
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                ホーム
              </Link>
              <Link
                href="/about"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                概要
              </Link>
              <Link
                href="/contact"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {userData ? (
              <span className="text-sm font-medium text-gray-700">
                ようこそ、{userData.username}さん
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-700">
                ローディング中...
              </span>
            )}
            <UserDropdown user={user} />
          </div>

          <div className="flex items-center space-x-4">
            <div className="ml-4">
              <Switch
                checked={isOptimizeActive}
                onCheckedChange={handleSwitchChange} // スイッチが切り替えられたときに呼び出される
                className={`${
                  isOptimizeActive ? 'bg-black' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">最適化機能を有効にする</span>
                <span
                  className={`${
                    isOptimizeActive ? 'translate-x-6' : 'translate-x-1'
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
                  <DropdownMenuItem>
                    <Link href="/">ホーム</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/about">概要</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/contact">お問い合わせ</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem>プロフィール</DropdownMenuItem>
                  <DropdownMenuItem>設定</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>ログアウト</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
