"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Users, Clock, User, Check, X, BookOpen, Info, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { jwtDecode } from "jwt-decode"

// システムメッセージカードコンポーネント（改良版）
const SystemMessageCard = ({ content, sentAt }) => {
  return (
    <div className="w-full my-4 px-4">
      <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-200 flex items-center">
          <Info className="h-5 w-5 text-gray-600 mr-2" />
          <span className="text-sm font-semibold text-gray-700">システム通知</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(sentAt).toLocaleString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ルール説明担当確認メッセージコンポーネント
const RuleApprovalCard = ({ content, sentAt, messageId, onAccept, onDecline }) => {
  const currentUserId = getCurrentUserId()
  const suggestGame = messageId.related_suggest_game
  const instructors = suggestGame.instructors || []

  // Check if the current user has already responded
  const hasUserResponded = instructors.some((i) => i.user_id === currentUserId && i.is_accepted !== null)

  // Find the instructor record for the current user
  const userInstructor = instructors.find((i) => i.user_id === currentUserId)

  return (
    <div className="w-full my-4 px-4">
      <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-200 flex items-center">
          <HelpCircle className="h-5 w-5 text-gray-600 mr-2" />
          <span className="text-sm font-semibold text-gray-700">ルール説明担当確認</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>

          {!hasUserResponded ? (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onDecline(suggestGame.id)}
              >
                <X className="h-4 w-4 mr-1" />
                見送る
              </Button>
              <Button variant="default" onClick={() => onAccept(suggestGame.id)}>
                <Check className="h-4 w-4 mr-1" />
                担当する
              </Button>
            </div>
          ) : (
            <div className="flex justify-end mt-4">
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                回答済み
              </Badge>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {new Date(sentAt).toLocaleString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ゲーム提案メッセージコンポーネント
const GameSuggestionMessage = ({ message, onAccept, onDecline }) => {
  const game = message.suggest_game.suggest_game
  const participants = message.suggest_game.participants
  const instructors = message.suggest_game.instructors
  const providers = message.suggest_game.providers
  const currentUserId = getCurrentUserId()

  // Check if the current user has already responded to this suggestion
  const hasUserResponded = participants.some((p) => p.user_id === currentUserId)

  // Get accepted participants for display
  const acceptedParticipants = participants.filter((p) => p.is_accepted)

  // Check if game is brought by a user or from the cafe
  const isBroughtByUser = providers && providers.length > 0

  return (
    <Card className="w-full mt-2 border border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{game.name}</CardTitle>
            {game.game_class && game.game_class.length > 0 && <Badge variant="secondary">{game.game_class[0]}</Badge>}
          </div>
          <div>
            {isBroughtByUser ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                持ち込み({providers.map((p) => p.provider).join(", ")})
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                カフェ所有
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 w-full sm:w-[150px] h-[200px] sm:h-[150px] bg-gray-200 rounded-md overflow-hidden">
            {game.box_image ? (
              <Image
                src={`http://localhost:8000${game.box_image}`}
                alt={`${game.name} ボックスアート`}
                width={300}
                height={300}
                className="object-cover w-full h-full"
                unoptimized // Add this to handle external images
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">画像がありません</div>
            )}
          </div>
          <div className="flex-grow flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {game.min_playtime}〜{game.max_playtime}分
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {game.min_players}〜{game.max_players}人
                </span>
              </div>
              {game.game_tags && game.game_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {game.game_tags.map((tag, i) => (
                    <Badge key={`tag-${i}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm flex-grow">
              {game.short_description || game.long_description || "ゲームの説明がありません。"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        {!hasUserResponded ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="w-32 border-destructive text-destructive hover:bg-destructive/10"
              onClick={onDecline}
            >
              <X className="h-4 w-4 mr-1" />
              見送る
            </Button>
            <Button variant="default" className="w-32" onClick={onAccept}>
              <Check className="h-4 w-4 mr-1" />
              遊びたい
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              回答済み
            </Badge>
          </div>
        )}
        {instructors && instructors.length > 0 && (
          <div className="w-full mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">説明できる人:</p>

              {instructors.map((instructor, i) => (
                <Badge key={`instructor-${i}`} variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{instructor.instructor}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        {acceptedParticipants && acceptedParticipants.length > 0 && (
          <div className="w-full mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">遊びたい人:</p>

              {acceptedParticipants.map((participant, i) => (
                <Badge key={`participant-${i}`} variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{participant.participant}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// ローカルストレージからトークンを取得する関数
const getToken = () => {
  const token = localStorage.getItem("token")
  return token
}

// Add this function to get the current user ID from the token:
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null

    const decoded = jwtDecode(token)
    return decoded.user_id || decoded.id || null
  } catch (error) {
    console.error("トークンのデコードに失敗しました:", error)
    return null
  }
}

// ローカルストレージからユーザー名を取得する関数
const getCurrentUsername = () => {
  // 実際のユーザー名取得ロジックに置き換えてください
  const username = localStorage.getItem("username")
  return username
}

export default function ChatComponent() {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUsername, setCurrentUsername] = useState("")
  const { id } = useParams()
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    // 現在のユーザー名を取得
    const username = getCurrentUsername()
    setCurrentUsername(username)

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
  }, [messages]) // Fixed dependency to update scroll when messages change

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

  const handleAcceptGame = async (message) => {
    try {
      const token = getToken()
      // 修正: suggest_gameのIDを正しく取得する
      const suggestGameId = message.suggest_game.id

      // 新しいエンドポイントを使用してゲーム参加を登録
      await axios.post(
        "http://localhost:8000/cafes/api/suggest_game_participants/",
        {
          suggest_game: suggestGameId,
          is_accepted: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // メッセージを再取得して画面を更新
      const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error("ゲームの承諾に失敗しました:", error)
    }
  }

  const handleDeclineGame = async (message) => {
    try {
      const token = getToken()
      // 修正: suggest_gameのIDを正しく取得する
      const suggestGameId = message.suggest_game.id

      // 新しいエンドポイントを使用してゲーム参加を辞退
      await axios.post(
        "http://localhost:8000/cafes/api/suggest_game_participants/",
        {
          suggest_game: suggestGameId,
          is_accepted: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // メッセージを再取得して画面を更新
      const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error("ゲームの辞退に失敗しました:", error)
    }
  }

  const handleAcceptRuleExplanation = async (suggestGameId) => {
    try {
      const token = getToken()

      // suggest_gameのIDを使用してルール説明担当を承諾
      await axios.patch(
        `http://localhost:8000/cafes/api/suggest_game_instructors/${suggestGameId}/accept/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // メッセージを再取得して画面を更新
      const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error("ルール説明の承諾に失敗しました:", error)
    }
  }

  const handleDeclineRuleExplanation = async (suggestGameId) => {
    try {
      const token = getToken()

      // suggest_gameのIDを使用してルール説明担当を辞退
      await axios.patch(
        `http://localhost:8000/cafes/api/suggest_game_instructors/${suggestGameId}/reject/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // メッセージを再取得して画面を更新
      const response = await axios.get(`http://localhost:8000/cafes/api/messages/?reservation_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error("ルール説明の辞退に失敗しました:", error)
    }
  }

  const handleCancelReservation = async () => {
    try {
      const token = getToken()
      const response = await axios.delete(`http://localhost:8000/match/api/participants/${id}/remove_participant/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.status === 200) {
        alert("予約をキャンセルしました。")
        window.location.href = "/boardgame"
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "予約キャンセルに失敗しました"
      console.error(errorMessage)
      alert(errorMessage)
    }
  }

  // システムメッセージを表示すべきかどうかを判断する関数
  const shouldShowSystemMessage = (message) => {
    // システムメッセージでない場合は関係ない
    if (!message.is_system_message) return false

    // receiverが空の配列の場合、全員に表示
    if (!message.receiver || message.receiver.length === 0) return true

    // receiverリストに現在のユーザー名が含まれている場合のみ表示
    return message.receiver.includes(currentUsername)
  }

  // ルール承認メッセージを表示すべきかどうかを判断する関数
  const shouldShowRuleApproval = (message) => {
    // ルール承認メッセージでない場合は関係ない
    if (!message.is_rule_approval) return false

    // receiverが空の配列の場合、全員に表示
    if (!message.receiver || message.receiver.length === 0) return true

    // 現在のユーザーIDを取得
    const currentUserId = getCurrentUserId()

    // receiverリストに現在のユーザーIDが含まれている場合のみ表示
    return message.receiver.includes(currentUserId)
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-120px)] p-4" ref={scrollAreaRef}>
          {messages && messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={index}>
                {/* 公開メッセージの表示 */}
                {message.is_public &&
                  !message.is_suggest &&
                  !message.is_system_message &&
                  !message.is_rule_approval && (
                    <div className={`flex items-start mb-4 ${message.is_user_sender ? "justify-end" : ""}`}>
                      {!message.is_user_sender && (
                        <Avatar className="mr-2">
                          <AvatarImage
                            src={
                              message.sender_profile_picture
                                ? `http://localhost:8000${message.sender_profile_picture}`
                                : null
                            }
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
                            src={
                              message.sender_profile_picture
                                ? `http://localhost:8000${message.sender_profile_picture}`
                                : null
                            }
                            alt={message.sender}
                          />
                          <AvatarFallback>{message.sender[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                {/* システムメッセージの表示（改良版） */}
                {shouldShowSystemMessage(message) && (
                  <SystemMessageCard content={message.content} sentAt={message.sent_at} />
                )}

                {/* ルール説明担当確認メッセージの表示 */}
                {shouldShowRuleApproval(message) && (
                  <RuleApprovalCard
                    content={message.content}
                    sentAt={message.sent_at}
                    messageId={message}
                    onAccept={handleAcceptRuleExplanation}
                    onDecline={handleDeclineRuleExplanation}
                  />
                )}

                {/* ゲーム提案メッセージの表示 */}
                {message.is_suggest && (
                  <div className="w-full mb-4 px-2">
                    <GameSuggestionMessage
                      message={message}
                      onAccept={() => handleAcceptGame(message)}
                      onDecline={() => handleDeclineGame(message)}
                    />
                  </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem onClick={handleCancelReservation}>予約をキャンセル</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="submit">送信</Button>
        </form>
      </div>
    </div>
  )
}

