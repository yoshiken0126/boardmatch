"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getToken } from "@/lib/auth"

export default function Home() {
  const [boardgames, setBoardgames] = useState([])
  const [userBoardGames, setUserBoardGames] = useState([])
  const [switchStates, setSwitchStates] = useState({})
  const [error, setError] = useState(null)
  const token = getToken()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardgamesResponse, userGamesResponse] = await Promise.all([
          axios.get("http://localhost:8000/match/api/boardgames/"),
          axios.get("http://localhost:8000/match/api/user_game_relations/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])
        console.log(boardgamesResponse)

        setBoardgames(boardgamesResponse.data)
        setUserBoardGames(userGamesResponse.data)

        const initialSwitchStates = userGamesResponse.data.reduce((acc, game) => {
          acc[game.game] = game.want_to_play
          return acc
        }, {})

        setSwitchStates(initialSwitchStates)
      } catch (error) {
        setError(error.message)
        console.error("データ取得エラー:", error)
      }
    }

    fetchData()
  }, [token])

  const handleSwitchChange = async (gameId, checked) => {
    try {
      if (checked) {
        const response = await axios.post(
          "http://localhost:8000/match/api/user_game_relations/",
          { game: gameId, want_to_play: true },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        setSwitchStates((prev) => ({ ...prev, [gameId]: true }))
      } else {
        const relationsResponse = await axios.get(
          `http://localhost:8000/match/api/user_game_relations/?game_id=${gameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const relationToDelete = relationsResponse.data.find((relation) => relation.game === gameId)

        if (relationToDelete) {
          await axios.delete(`http://localhost:8000/match/api/user_game_relations/${relationToDelete.id}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          setSwitchStates((prev) => ({ ...prev, [gameId]: false }))
        }
      }
    } catch (error) {
      console.error("スイッチ操作エラー:", error)
      setSwitchStates((prev) => ({ ...prev, [gameId]: !checked }))
    }
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center">エラーが発生しました: {error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {boardgames.length === 0 ? (
        <p className="text-center text-lg">ボードゲームは登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {boardgames.map((boardgame) => (
            <Card key={boardgame.id} className="relative w-full rounded-md overflow-hidden">
              <div className="flex p-6">
                <div className="w-40 h-40 relative flex-shrink-0 bg-gray-200 rounded-md mr-6">
                  {boardgame.box_image && (
                    <img
                      src={boardgame.box_image || "/placeholder.svg"}
                      alt={`${boardgame.name} box`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardHeader className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-grow">
                        <CardTitle className="text-xl font-bold truncate">{boardgame.name}</CardTitle>
                        <div className="flex space-x-1">
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
                        checked={switchStates[boardgame.id] || false}
                        onCheckedChange={(checked) => handleSwitchChange(boardgame.id, checked)}
                        className="ml-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
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
                  <CardFooter className="flex justify-start items-end p-0 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {boardgame.game_tags &&
                        boardgame.game_tags.map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {tag}
                          </span>
                        ))}
                    </div>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}












