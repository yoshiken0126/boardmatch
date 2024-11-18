'use client';
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Home, Search, Bell, MessageCircle, Heart, Repeat2, Share } from "lucide-react"

export function TwitterLikeUiJsx() {
  return (
    (<div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">ホーム</h1>
        <Avatar>
          <AvatarImage src="/placeholder-avatar.jpg" alt="@username" />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
      </header>
      <main className="flex-1 overflow-auto">
        <Card className="rounded-none border-x-0 border-t-0">
          <CardHeader className="flex flex-row space-x-4 p-4">
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" alt="@johndoe" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">John Doe</p>
              <p className="text-sm text-muted-foreground">@johndoe</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p>これはサンプルのツイートです。Twitterのようなインターフェースを模しています。</p>
          </CardContent>
          <CardFooter className="flex justify-between p-4">
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Repeat2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* 追加のツイートをここに挿入 */}
      </main>
      <footer className="border-t bg-background">
        <nav className="flex justify-around p-2">
          <Button variant="ghost" size="icon">
            <Home className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" />
          </Button>
        </nav>
      </footer>
    </div>)
  );
}