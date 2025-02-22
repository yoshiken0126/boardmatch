"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getToken } from "@/lib/auth"
import { Edit } from "lucide-react"

export default function Home() {
  const [userFollows, setUserFollows] = useState([])
  const token = getToken()
  const [switchStates, setSwitchStates] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState("")
  const [editingRelationId, setEditingRelationId] = useState(null)

  useEffect(() => {
    axios
      .get("http://localhost:8000/match/api/user_relations/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const followRelations = response.data
        setUserFollows(followRelations)
        console.log(response)

        const initialSwitchStates = followRelations.reduce((acc, follow) => {
          acc[follow.id] = follow.may_follow
          return acc
        }, {})
        setSwitchStates(initialSwitchStates)
      })
      .catch((error) => {
        console.error("ユーザーのフォロー関係の取得中にエラーが発生しました:", error)
      })
  }, [token])

  const handleSwitchChange = async (relationId, toUserId, checked) => {
    try {
      const existingRelation = userFollows.find((relation) => relation.id === relationId)

      if (existingRelation) {
        const response = await axios.patch(
          `http://localhost:8000/match/api/user_relations/${relationId}/`,
          { may_follow: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        setUserFollows((prevUserFollows) =>
          prevUserFollows.map((relation) =>
            relation.id === relationId ? { ...relation, may_follow: checked } : relation,
          ),
        )

        setSwitchStates((prev) => ({
          ...prev,
          [relationId]: checked,
        }))
      }
    } catch (error) {
      console.error("フォロー関係の更新中にエラーが発生しました:", error)
      setSwitchStates((prev) => ({
        ...prev,
        [relationId]: !checked,
      }))
    }
  }

  const handleEditMemo = (relationId, currentMemo) => {
    setEditingRelationId(relationId)
    setEditingMemo(currentMemo)
    setDialogOpen(true)
  }

  const handleSaveMemo = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:8000/match/api/user_relations/${editingRelationId}/`,
        { memo: editingMemo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setUserFollows((prevUserFollows) =>
        prevUserFollows.map((relation) =>
          relation.id === editingRelationId ? { ...relation, memo: editingMemo } : relation,
        ),
      )

      setDialogOpen(false)
    } catch (error) {
      console.error("メモの更新中にエラーが発生しました:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {userFollows.length === 0 ? (
        <p>フォローしているユーザーはまだいません。</p>
      ) : (
        <ul className="space-y-4">
          {userFollows.map((follow) => (
            <Card key={follow.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage
                        src={follow.to_user.profile_picture || "/placeholder.svg"}
                        alt={follow.to_user.username}
                      />
                      <AvatarFallback>{follow.to_user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold mr-2">{follow.to_user.username} さん</h3>
                        <div className="flex flex-wrap">
                          {follow.to_user.game_class.map((gameClass, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-1"
                            >
                              {gameClass}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={switchStates[follow.id] || false}
                      onCheckedChange={(checked) => handleSwitchChange(follow.id, follow.to_user, checked)}
                    />
                  </div>
                </div>
                <div className="mt-2 p-2 bg-gray-100 rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm flex-grow mr-2">{follow.memo || "（メモはありません）"}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleEditMemo(follow.id, follow.memo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メモを編集</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingMemo}
            onChange={(e) => setEditingMemo(e.target.value)}
            placeholder="メモを入力してください"
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button onClick={handleSaveMemo}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






