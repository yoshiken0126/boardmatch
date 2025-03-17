"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { getToken } from "@/lib/auth"

export default function Home() {
  const [boardgames, setBoardgames] = useState([])
  const [userBoardGames, setUserBoardGames] = useState([])
  const [gameRelations, setGameRelations] = useState({})
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef(null)
  const token = getToken()

  const fetchBoardgames = async (pageNum) => {
    try {
      setLoading(true)
      const boardgamesResponse = await axios.get(`http://localhost:8000/match/api/boardgames/?page=${pageNum}`)

      // Check if we have more pages
      setHasMore(boardgamesResponse.data.next !== null)

      // If it's the first page, replace the data, otherwise append
      if (pageNum === 1) {
        setBoardgames(boardgamesResponse.data.results)
      } else {
        setBoardgames((prev) => [...prev, ...boardgamesResponse.data.results])
      }

      return boardgamesResponse.data.results
    } catch (error) {
      setError(error.message)
      console.error("ボードゲーム取得エラー:", error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchUserGameRelations = async () => {
    try {
      const userGamesResponse = await axios.get("http://localhost:8000/match/api/user_game_relations/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setUserBoardGames(userGamesResponse.data)

      // Initialize game relations with all properties
      const initialRelations = {}
      userGamesResponse.data.forEach((relation) => {
        if (!initialRelations[relation.game]) {
          initialRelations[relation.game] = {
            want_to_play: false,
            can_instruct: false,
            not_for_me: false,
            is_having: false,
            relationId: null,
          }
        }

        // Update with actual values from the relation
        initialRelations[relation.game] = {
          want_to_play: relation.want_to_play,
          can_instruct: relation.can_instruct,
          not_for_me: relation.not_for_me,
          is_having: relation.is_having,
          relationId: relation.id,
        }
      })

      setGameRelations(initialRelations)
    } catch (error) {
      console.error("ユーザーゲーム関係取得エラー:", error)
    }
  }

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchBoardgames(1)
      await fetchUserGameRelations()
    }

    fetchInitialData()
  }, [token])

  // Setup intersection observer for infinite scrolling
  const lastBoardgameRef = useCallback(
    (node) => {
      if (loading) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore],
  )

  // Load more data when page changes
  useEffect(() => {
    if (page > 1) {
      fetchBoardgames(page)
    }
  }, [page])

  const handleRelationChange = async (gameId, property, checked) => {
    try {
      // 楽観的UIアップデート - 即座にUIを更新
      const currentRelation = gameRelations[gameId] || {
        want_to_play: false,
        can_instruct: false,
        not_for_me: false,
        is_having: false,
        relationId: null,
      }

      // 新しい状態を作成
      const updatedRelation = {
        ...currentRelation,
        [property]: checked,
      }

      // UIを先に更新
      setGameRelations((prev) => ({
        ...prev,
        [gameId]: updatedRelation,
      }))

      // バックエンドにPATCHリクエストを送信（gameIdをURLに含める）
      await axios.patch(
        `http://localhost:8000/match/api/user_game_relations/${gameId}/`,
        {
          [property]: checked,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // 成功した場合、最新の関係データを取得（オプション）
      // await fetchUserGameRelations()
    } catch (error) {
      console.error("スイッチ操作エラー:", error)

      // エラーが発生した場合、UIを元の状態に戻す
      const currentRelation = gameRelations[gameId] || {
        want_to_play: false,
        can_instruct: false,
        not_for_me: false,
        is_having: false,
        relationId: null,
      }

      setGameRelations((prev) => ({
        ...prev,
        [gameId]: {
          ...currentRelation,
          [property]: !checked, // 変更を元に戻す
        },
      }))
    }
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center">エラーが発生しました: {error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {boardgames.length === 0 && !loading ? (
        <p className="text-center text-lg">ボードゲームは登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {boardgames.map((boardgame, index) => {
            // Add ref to the last item for infinite scrolling
            const isLastItem = index === boardgames.length - 1
            return (
              <Card
                key={boardgame.id}
                className="relative w-full rounded-md overflow-hidden"
                ref={isLastItem ? lastBoardgameRef : null}
              >
                <div className="flex flex-col md:flex-row p-4 md:p-6">
                  <div className="w-full md:w-40 h-40 relative flex-shrink-0 bg-gray-200 rounded-md md:mr-6 mb-4 md:mb-0">
                    {boardgame.box_image && (
                      <img
                        src={boardgame.box_image || "/placeholder.svg"}
                        alt={`${boardgame.name} box`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <CardHeader className="p-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-grow">
                          <CardTitle className="text-xl font-bold truncate">{boardgame.name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {boardgame.game_class &&
                              boardgame.game_class.map((classItem, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full"
                                >
                                  {classItem}
                                </span>
                              ))}
                          </div>
                        </div>
                        <Switch
                          checked={gameRelations[boardgame.id]?.want_to_play || false}
                          onCheckedChange={(checked) => handleRelationChange(boardgame.id, "want_to_play", checked)}
                          className="ml-2 flex-shrink-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                      <CardDescription className="text-sm space-y-1">
                        {boardgame.designers.length > 0 && (
                          <p className="truncate">デザイナー: {boardgame.designers.join(", ")}</p>
                        )}
                        <p>
                          プレイ人数: {boardgame.min_players}-{boardgame.max_players}人
                        </p>
                        <p>
                          プレイ時間: {boardgame.min_playtime}-{boardgame.max_playtime}分
                        </p>
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="flex justify-between items-end p-0 mt-4">
                      <div className="flex flex-wrap gap-1 max-w-[80%]">
                        {boardgame.game_tags &&
                          boardgame.game_tags.map((tag, index) => (
                            <span key={index} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {tag}
                            </span>
                          ))}
                      </div>
                      <Dialog
                        open={openDialog === boardgame.id}
                        onOpenChange={(open) => setOpenDialog(open ? boardgame.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            詳細
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{boardgame.name} の設定</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                              <span>やりたいゲーム</span>
                              <Switch
                                checked={gameRelations[boardgame.id]?.want_to_play || false}
                                onCheckedChange={(checked) =>
                                  handleRelationChange(boardgame.id, "want_to_play", checked)
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>説明できるゲーム</span>
                              <Switch
                                checked={gameRelations[boardgame.id]?.can_instruct || false}
                                onCheckedChange={(checked) =>
                                  handleRelationChange(boardgame.id, "can_instruct", checked)
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>持って行けるゲーム</span>
                              <Switch
                                checked={gameRelations[boardgame.id]?.is_having || false}
                                onCheckedChange={(checked) => handleRelationChange(boardgame.id, "is_having", checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>合わないゲーム</span>
                              <Switch
                                checked={gameRelations[boardgame.id]?.not_for_me || false}
                                onCheckedChange={(checked) => handleRelationChange(boardgame.id, "not_for_me", checked)}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            )
          })}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

