"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getToken } from "@/lib/auth"

export default function ChatComponent() {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { id } = useParams()
  const scrollAreaRef = useRef(null)

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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [scrollAreaRef])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const token = getToken()
      await axios.post(
        "http://localhost:8000/cafes/api/messages/",
        {
          reservation: id,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
    <div className="max-w-4xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages && messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={index} className={`flex items-start mb-4 ${message.is_user_sender ? "justify-end" : ""}`}>
                {!message.is_user_sender && (
                  <Avatar className="mr-2">
                    <AvatarImage 
                      src={`http://localhost:8000${message.sender_profile_picture}`} 
                      alt={message.sender} 
                    />
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${message.is_user_sender ? "text-right" : ""}`}>
                  <p className="text-sm font-medium">{message.sender}</p>
                  <div
                    className={`p-2 rounded-lg ${message.is_user_sender ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.sent_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                {message.is_user_sender && (
                  <Avatar className="ml-2">
                    <AvatarImage 
                      src={`http://localhost:8000${message.sender_profile_picture}`} 
                      alt={message.sender} 
                    />
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          ) : (
            <div>メッセージがありません。</div>
          )}
        </ScrollArea>
      </div>
      <div className="p-4 border-t bg-background fixed bottom-16 left-0 right-0">
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
          <Button type="submit">送信</Button>
        </form>
      </div>
    </div>
  )
}