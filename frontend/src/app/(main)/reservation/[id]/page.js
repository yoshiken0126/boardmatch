"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Users, Clock, User, Check, X, BookOpen, Info, HelpCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"
import { jwtDecode } from "jwt-decode"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const isApproved = message.suggest_game.is_approved

  // Check if the current user has already responded to this suggestion
  const hasUserResponded = participants.some((p) => p.user_id === currentUserId)

  // Get accepted participants for display
  const acceptedParticipants = participants.filter((p) => p.is_accepted)

  // Check if game is brought by a user or from the cafe
  const isBroughtByUser = providers && providers.length > 0

  // カードのスタイルを承認状態に応じて変更
  const getCardStyle = () => {
    if (isApproved === true) {
      return "w-full mt-2 border-2 border-gray-800 bg-gray-100 shadow-md"
    } else {
      // Falseの場合もNoneと同じスタイルに
      return "w-full mt-2 border border-primary/20"
    }
  }

  // タイトル部分のスタイルを承認状態に応じて変更
  const getTitleStyle = () => {
    if (isApproved === true) {
      return "text-lg text-gray-900 font-semibold"
    } else {
      // Falseの場合もNoneと同じスタイルに
      return "text-lg"
    }
  }

  return (
    <Card className={getCardStyle()}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className={getTitleStyle()}>{game.name}</CardTitle>
            {game.game_class && game.game_class.length > 0 && <Badge variant="secondary">{game.game_class[0]}</Badge>}
            {isApproved === true && (
              <Badge variant="outline" className="bg-gray-800 text-gray-100 border-gray-700">
                承認済み
              </Badge>
            )}
            {isApproved === false && (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                非承認
              </Badge>
            )}
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

// ゲーム提案コンポーネント
const GameSuggestionComponent = ({ open, setOpen }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedClass, setSelectedClass] = useState("all")
  const [activeTab, setActiveTab] = useState("cafe")
  const [cafeGames, setCafeGames] = useState([])
  const [personalGames, setPersonalGames] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { id } = useParams() // 予約IDを取得

  // クラス値のマッピング関数を追加
  const mapClassToApiParam = (displayClass) => {
    const classMapping = {
      all: "all",
      重量級: "heavy",
      中量級: "medium",
      軽量級: "light",
    }
    return classMapping[displayClass] || "all"
  }

  // 逆のマッピング関数（APIの値から表示用の値へ）
  const mapApiParamToClass = (apiParam) => {
    const reverseMapping = {
      all: "all",
      heavy: "重量級",
      medium: "中量級",
      light: "軽量級",
    }
    return reverseMapping[apiParam] || "all"
  }

  // カフェのゲームを取得する関数を修正
  const fetchCafeGames = async (playerClass = "all") => {
    try {
      setIsLoading(true)
      const token = getToken()

      // 日本語のクラス名をAPI用のパラメータに変換
      const classParam = mapClassToApiParam(playerClass)

      // 予約IDを使用してAPIを呼び出す
      const response = await axios.get(`http://localhost:8000/cafes/api/cafe_have_suggest_games/${id}/${classParam}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // APIから返されたデータをそのまま使用
      setCafeGames(response.data || [])
      console.log("取得したカフェのゲーム:", response.data)
    } catch (error) {
      console.error("カフェのゲーム取得に失敗しました:", error)
      setCafeGames([])
    } finally {
      setIsLoading(false)
    }
  }

  // 個人の持ち込みゲームを取得する関数を修正
  const fetchPersonalGames = async () => {
    try {
      setIsLoading(true)
      const token = getToken()
      const userId = getCurrentUserId()

      // 日本語のクラス名をAPI用のパラメータに変換
      const classParam = mapClassToApiParam(selectedClass)

      // 予約IDとユーザーIDを使用してAPIを呼び出す
      const response = await axios.get(`http://localhost:8000/cafes/api/user_have_suggest_games/${id}/${classParam}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPersonalGames(response.data || [])
      console.log("取得した個人のゲーム:", response.data)
    } catch (error) {
      console.error("個人のゲーム取得に失敗しました:", error)
      setPersonalGames([])
    } finally {
      setIsLoading(false)
    }
  }

  // コンポーネントがマウントされたときにゲームを取得
  useEffect(() => {
    fetchCafeGames()
    fetchPersonalGames()
  }, [])

  // クラスが変更されたときに両方のゲームリストを再取得
  useEffect(() => {
    fetchCafeGames(selectedClass)
    if (activeTab === "bring") {
      fetchPersonalGames()
    }
  }, [selectedClass, activeTab, id])

  // 現在のタブに基づいてゲームをフィルタリング
  const getFilteredGames = () => {
    const games = activeTab === "cafe" ? cafeGames : personalGames

    return games.filter((item) => {
      // どちらのタブでも item.game からデータを取得
      const game = item.game

      return (
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedClass === "all" || (game.game_class && game.game_class.includes(selectedClass)))
      )
    })
  }

  const filteredGames = getFilteredGames()

  // ゲームを選択する関数を修正
  const handleSelectGame = (item) => {
    // カフェゲームの場合は game プロパティを含む全体を保存
    setSelectedGame(item)
  }

  // ゲームを提案する関数 - sourceパラメータを削除
  const handleSuggestGame = async () => {
    if (!selectedGame) return

    try {
      const token = getToken()

      // ゲーム提案のAPIを呼び出す - sourceパラメータを削除
      await axios.post(
        "http://localhost:8000/cafes/api/suggest_games/",
        {
          reservation: id,
          game: activeTab === "cafe" ? selectedGame.game.id : selectedGame.id,
          // sourceパラメータを削除
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // ダイアログを閉じて状態をリセット
      console.log(id)
      console.log(selectedGame)
      setOpen(false)
      setSelectedGame(null)
      setSearchQuery("")

      // 成功メッセージを表示（オプション）
      alert("ゲームを提案しました")
    } catch (error) {
      console.error("ゲーム提案に失敗しました:", error)
      alert("ゲーム提案に失敗しました: " + (error.response?.data?.message || error.message))
    }
  }

  // デザイナー名を表示する関数を修正
  const renderDesigners = (designers) => {
    if (!designers || designers.length === 0) return null

    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>デザイナー: </span>
        <span>{Array.isArray(designers) ? designers.join(", ") : designers}</span>
      </div>
    )
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>ゲームを提案する</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="game-class">クラス</Label>
          <Select defaultValue="all" onValueChange={setSelectedClass}>
            <SelectTrigger id="game-class">
              <SelectValue placeholder="クラスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="重量級">重量級</SelectItem>
              <SelectItem value="中量級">中量級</SelectItem>
              <SelectItem value="軽量級">軽量級</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="game-search">ゲームを検索</Label>
          <Input
            id="game-search"
            placeholder="ゲーム名を入力..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="cafe" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cafe">カフェ</TabsTrigger>
            <TabsTrigger value="bring">持ち込み</TabsTrigger>
          </TabsList>

          {/* カフェタブのゲーム表示部分を修正 */}
          <TabsContent value="cafe">
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>読み込み中...</p>
                </div>
              ) : filteredGames.length > 0 ? (
                filteredGames.map((item) => {
                  const game = item.game
                  return (
                    <Card
                      key={game.id}
                      className={`mb-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedGame?.game?.id === game.id ? "border-2 border-primary" : ""}`}
                      onClick={() => handleSelectGame(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{game.name}</h3>
                            {renderDesigners(game.designers)}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {game.min_playtime}〜{game.max_playtime}分
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                <span>
                                  {game.min_players}〜{game.max_players}人
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mt-2">{game.short_description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            {game.game_class && game.game_class.length > 0 && (
                              <Badge variant="outline">{game.game_class[0]}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          {game.game_tags && game.game_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {game.game_tags.map((tag, i) => (
                                <Badge key={`tag-${i}`} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>遊びたい: {item.want_to_play_count}</span>
                          </Badge>
                        </div>
                        {game.box_image && (
                          <div className="mt-2 w-full h-20 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={`http://localhost:8000${game.box_image}`}
                              alt={`${game.name} ボックスアート`}
                              width={80}
                              height={80}
                              className="object-contain h-full mx-auto"
                              unoptimized
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  検索結果がありません
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bring">
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>読み込み中...</p>
                </div>
              ) : filteredGames.length > 0 ? (
                filteredGames.map((item) => {
                  const game = item.game
                  return (
                    <Card
                      key={game.id}
                      className={`mb-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedGame?.game?.id === game.id ? "border-2 border-primary" : ""}`}
                      onClick={() => handleSelectGame(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{game.name}</h3>
                            {renderDesigners(game.designers)}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {game.min_playtime}〜{game.max_playtime}分
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                <span>
                                  {game.min_players}〜{game.max_players}人
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mt-2">{game.short_description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            {game.game_class && game.game_class.length > 0 && (
                              <Badge variant="outline">{game.game_class[0]}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          {game.game_tags && game.game_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {game.game_tags.map((tag, i) => (
                                <Badge key={`tag-${i}`} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>遊びたい: {item.want_to_play_count}</span>
                          </Badge>
                        </div>
                        {game.box_image && (
                          <div className="mt-2 w-full h-20 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={`http://localhost:8000${game.box_image}`}
                              alt={`${game.name} ボックスアート`}
                              width={80}
                              height={80}
                              className="object-contain h-full mx-auto"
                              unoptimized
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  検索結果がありません
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button
          onClick={handleSuggestGame}
          disabled={!selectedGame}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          提案する
        </Button>
      </DialogFooter>
    </DialogContent>
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
  const [gameSuggestionOpen, setGameSuggestionOpen] = useState(false)
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

          {/* ゲーム提案ボタン - ダイアログとドロップダウンを分離 */}
          <Button variant="outline" size="icon" type="button" onClick={() => setGameSuggestionOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          {/* ダイアログを別で管理 */}
          <Dialog
            open={gameSuggestionOpen}
            onOpenChange={(open) => {
              setGameSuggestionOpen(open)
              // ダイアログが閉じられた後にスクロール位置を復元
              if (!open && scrollAreaRef.current) {
                setTimeout(() => {
                  if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
                  }
                }, 100)
              }
            }}
          >
            <GameSuggestionComponent open={gameSuggestionOpen} setOpen={setGameSuggestionOpen} />
          </Dialog>

          {/* 他のアクション用のドロップダウンを分離 */}
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

