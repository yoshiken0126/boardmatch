"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const dummyMessages = [
  {
    id: 1,
    sender: { name: "ユーザー1", avatar: "/placeholder.svg?height=40&width=40" },
    content: "こんにちは！",
    sentAt: "2023-05-01T10:00:00Z",
  },
  {
    id: 2,
    sender: { name: "ユーザー2", avatar: "/placeholder.svg?height=40&width=40" },
    content: "はじめまして！",
    sentAt: "2023-05-01T10:05:00Z",
  },
  {
    id: 3,
    sender: { name: "スタッフ", isStaff: true },
    content: "ご予約ありがとうございます。",
    sentAt: "2023-05-01T10:10:00Z",
  },
]

export default function ChatComponent(props) {
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    // 実際の送信ロジックはここに実装します
    console.log("メッセージを送信:", newMessage)
    setNewMessage("")
  }

  return (
    <div className="flex flex-col h-screen border rounded-lg">
      <ScrollArea className="flex-1 p-4">
        {dummyMessages.map((message) => (
          <div key={message.id} className={`flex items-start mb-4 ${message.sender.isStaff ? "justify-end" : ""}`}>
            <Avatar className="mr-2">
              <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
              <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{message.sender.name}</p>
              <div
                className={`p-2 rounded-lg ${message.sender.isStaff ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                {message.content}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(message.sentAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>送信</Button>
        </div>
      </div>
    </div>
  )
}