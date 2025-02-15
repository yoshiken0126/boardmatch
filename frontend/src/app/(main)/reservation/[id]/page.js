"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getToken } from "@/lib/auth"
import { Send } from 'lucide-react'

export default function ChatComponent() {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { id } = useParams()

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const token = getToken()
        const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setMessages(response.data || [])
        console.log("取得したメッセージ:", response.data)
      } catch (error) {
        console.error("メッセージの取得に失敗しました:", error)
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [id])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const token = getToken()
      await axios.post(
        'http://localhost:8000/cafes/api/messages/',
        {
          reservation: id,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setNewMessage("")
      
      const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      setMessages(response.data || [])

    } catch (error) {
      console.error("メッセージの送信に失敗しました:", error)
    }
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="flex flex-col h-screen border rounded-lg bg-background">
      <ScrollArea className="flex-1 p-4">
        {messages && messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className={`flex items-start mb-4 ${message.is_user_sender ? 'justify-end' : ''}`}>
              {!message.is_user_sender && (
                <Avatar className="mr-2">
                  <AvatarImage src="/placeholder.svg" alt={message.sender} />
                  <AvatarFallback>{message.sender[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] ${message.is_user_sender ? 'text-right' : ''}`}>
                <p className="text-sm font-medium">{message.sender}</p>
                <div className={`p-2 rounded-lg ${message.is_user_sender ? 'bg-black text-white' : 'bg-secondary'}`}>
                  {message.content}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(message.sent_at).toLocaleString("ja-JP")}
                </p>
              </div>
              {message.is_user_sender && (
                <Avatar className="ml-2">
                  <AvatarImage src="/placeholder.svg" alt={message.sender} />
                  <AvatarFallback>{message.sender[0]}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        ) : (
          <div>メッセージがありません。</div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex space-x-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">送信</span>
          </Button>
        </form>
      </div>
    </div>
  )
}