"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getToken } from "@/lib/auth"
import Image from "next/image"

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
          })
        ])

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
          }
        )
        setSwitchStates(prev => ({ ...prev, [gameId]: true }))
      } else {
        const relationsResponse = await axios.get(
          `http://localhost:8000/match/api/user_game_relations/?game_id=${gameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const relationToDelete = relationsResponse.data.find(
          (relation) => relation.game === gameId
        )

        if (relationToDelete) {
          await axios.delete(
            `http://localhost:8000/match/api/user_game_relations/${relationToDelete.id}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          setSwitchStates(prev => ({ ...prev, [gameId]: false }))
        }
      }
    } catch (error) {
      console.error("スイッチ操作エラー:", error)
      setSwitchStates(prev => ({ ...prev, [gameId]: !checked }))
    }
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center">エラーが発生しました: {error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      {boardgames.length === 0 ? (
        <p className="text-center text-lg">ボードゲームは登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {boardgames.map((boardgame) => (
            <Card key={boardgame.id} className="relative flex flex-row items-start w-full rounded-md">
              <div className="w-20 h-20 relative flex-shrink-0 m-4 bg-gray-200 rounded-md" />
              <div className="flex-1 min-w-0 py-4 pr-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold truncate">{boardgame.name}</CardTitle>
                  <CardDescription className="text-sm space-y-0.5 mt-1">
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
                </CardHeader>
                <CardFooter className="flex justify-end p-0 mt-2">
                  {boardgame.game_categories.map((category, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full ml-1">
                      {category}
                    </span>
                  ))}
                </CardFooter>
              </div>
              <div className="absolute top-0 right-0 p-4">
                <Switch
                  checked={switchStates[boardgame.id] || false}
                  onCheckedChange={(checked) => handleSwitchChange(boardgame.id, checked)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}



