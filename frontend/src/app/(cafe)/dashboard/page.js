"use client"

import React, { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { format, addWeeks, startOfWeek, addDays, isSameDay, set, parseISO, differenceInMinutes } from "date-fns"
import { ja } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// トークン取得関数のインポート（別ファイルで定義されていると仮定）
import { getToken } from "@/lib/auth"

export const HOURS = Array.from({ length: 10 }, (_, i) => i + 13)

// 予約バーのスタイルを計算する関数
export function getReservationStyle(reservation) {
  const startTime = parseISO(reservation.startTime)
  const endTime = parseISO(reservation.endTime)

  // タイムラインの開始時間（13:00）からの経過分数を計算
  const timelineStart = set(startTime, { hours: 13, minutes: 0, seconds: 0 })
  const startOffset = differenceInMinutes(startTime, timelineStart)
  const endOffset = differenceInMinutes(endTime, timelineStart)

  // タイムラインの全幅は10時間（600分）
  const totalMinutes = 10 * 60

  // パーセンテージ位置を計算
  const leftPosition = (startOffset / totalMinutes) * 100
  const width = ((endOffset - startOffset) / totalMinutes) * 100

  // 幅が負にならないようにする
  if (width < 0) {
    return {} // 無効な幅の場合は空のオブジェクトを返す
  }

  // 予約バーの幅を少し縮小し、マージンを追加
  const marginPercentage = 0.5 // 0.5%のマージン（両側で合計1%）
  const adjustedWidth = width - marginPercentage * 2
  const adjustedLeft = leftPosition + marginPercentage

  const minWidth = 0.5 // 最小幅を0.5%に設定
  const finalWidth = Math.max(adjustedWidth, minWidth)

  return {
    position: "absolute",
    left: `${adjustedLeft}%`,
    width: `${finalWidth}%`,
    height: "80%",
    top: "10%",
    backgroundColor: (() => {
      switch (reservation.reservationType) {
        case "user":
          return "hsl(142, 76%, 36%)" // 濃い緑
        case "match":
          return "hsl(217, 91%, 30%)" // 濃い青
        case "staff":
          return "hsl(0, 84%, 40%)" // 濃い赤
        default:
          return "hsl(var(--secondary))"
      }
    })(),
    borderRadius: "4px",
    color: "#ffffff", // テキストは白で統一
    padding: "4px",
    fontSize: "0.75rem",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    zIndex: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
  }
}

const parseReservations = (reservationsData) => {
  return reservationsData.map((reservation) => {
    const participantNames = Array.isArray(reservation.participants)
      ? reservation.participants.map((participant) => participant.user || "Unknown")
      : []

    return {
      id: reservation.id || Math.random().toString(36).substr(2, 9),
      tableIds: reservation.table, // Change tableId to tableIds
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      date: format(parseISO(reservation.start_time), "yyyy-MM-dd"),
      cafe: reservation.cafe,
      reservationType: reservation.reservation_type,
      participants: participantNames,
    }
  })
}

export default function CafeReservation() {
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [tables, setTables] = useState([])
  const [error, setError] = useState("")
  const [cafeData, setCafeData] = useState(null)
  const [reservations, setReservations] = useState([])
  const [currentDate, setCurrentDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [reservationDate, setReservationDate] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [reservationStartTime, setReservationStartTime] = useState("")
  const [reservationEndTime, setReservationEndTime] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState(2)

  // 参加者募集関連の状態
  const [isRecruiting, setIsRecruiting] = useState(false)
  const [playerClass, setPlayerClass] = useState("")
  const [recruitmentCount, setRecruitmentCount] = useState(1)
  const [cafeGames, setCafeGames] = useState([])
  const [selectedCafeGames, setSelectedCafeGames] = useState([])
  const [cafeGameSearch, setCafeGameSearch] = useState("")

  const weeks = useMemo(() => {
    if (!currentDate) return []
    return Array.from({ length: 5 }, (_, i) => {
      const weekStart = startOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j))
    })
  }, [currentDate])

  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const token = getToken()
        const response = await axios.get("http://localhost:8000/cafes/api/tables/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setTables(
          response.data.map((table) => ({
            id: table.id,
            name: table.table_name,
          })),
        )
      } catch (err) {
        console.error("Error fetching tables:", err)
        setError("テーブル情報の取得に失敗しました。")
      }
    }

    fetchTables()
  }, [])

  useEffect(() => {
    const fetchBoardGameCafe = async () => {
      try {
        const token = getToken()
        const response = await fetch("http://localhost:8000/cafes/api/boardgamecafes/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch board game cafe data")
        }
        const data = await response.json()
        setCafeData(data[0])
        setSelectedCafe(data[0])
      } catch (err) {
        console.error("Error fetching board game cafe data:", err)
        setCafeData(null)
      }
    }

    fetchBoardGameCafe()
  }, [])

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = getToken()
        const response = await axios.get("http://localhost:8000/cafes/api/reservations/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const parsedReservations = parseReservations(response.data)
        setReservations(parsedReservations)
        console.log(response)
      } catch (err) {
        console.error("Error fetching reservations:", err)
        setError("予約情報の取得に失敗しました。")
      }
    }

    fetchReservations()
  }, [])

  // プレイヤークラスが変更されたときにゲームリストを取得
  useEffect(() => {
    if (playerClass && selectedCafe?.id) {
      fetchCafeGames(selectedCafe.id, playerClass)
    }
  }, [playerClass, selectedCafe])

  const fetchCafeGames = async (cafeId, playerClass) => {
    if (!cafeId || !playerClass) return

    try {
      const token = getToken()
      const response = await axios.get(`http://localhost:8000/match/api/cafe_have_games/${cafeId}/${playerClass}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCafeGames(response.data)
    } catch (error) {
      console.error("カフェのゲームリストの取得中にエラーが発生しました:", error)
      setError("カフェのゲームリストの取得中にエラーが発生しました")
    }
  }

  const isWithinBusinessHours = (day, hour) => {
    if (!cafeData) return false

    const dayOfWeek = format(day, "EEEE").toLowerCase()
    const openTimeKey = `${dayOfWeek}_open`
    const closeTimeKey = `${dayOfWeek}_close`

    const openTime = cafeData[openTimeKey]
    const closeTime = cafeData[closeTimeKey]

    if (openTime === null || closeTime === null) return false

    const currentTime = set(day, { hours: hour, minutes: 0, seconds: 0 })
    const openDateTime = set(day, {
      hours: Number.parseInt(openTime.split(":")[0]),
      minutes: Number.parseInt(openTime.split(":")[1]),
      seconds: 0,
    })
    const closeDateTime = set(day, {
      hours: Number.parseInt(closeTime.split(":")[0]),
      minutes: Number.parseInt(closeTime.split(":")[1]),
      seconds: 0,
    })

    if (closeDateTime < openDateTime) {
      if (hour < Number.parseInt(openDateTime.getHours())) {
        return false
      }
      closeDateTime.setDate(closeDateTime.getDate() + 1)
    }

    return currentTime >= openDateTime && currentTime < closeDateTime
  }

  const handleReservationClick = (cafe, date) => {
    setSelectedCafe(cafe)
    setIsModalOpen(true)
    setReservationDate(date)
    setSelectedCourse("")
    setReservationStartTime("")
    setReservationEndTime("")
    setNumberOfPeople(2)
    setIsRecruiting(false)
    setPlayerClass("")
    setRecruitmentCount(1)
    setSelectedCafeGames([])
    setCafeGameSearch("")
    setError("")
  }

  const handleCourseChange = (course) => {
    setSelectedCourse(course)
    setError("") // コース変更時にエラーをクリア
    if (course === "afternoon") {
      setReservationStartTime("13:00")
      setReservationEndTime("18:00")
    } else if (course === "evening") {
      setReservationStartTime("18:00")
      setReservationEndTime("23:00")
    } else {
      setReservationStartTime("")
      setReservationEndTime("")
    }
  }

  const handleStartTimeChange = (time) => {
    setReservationStartTime(time)
    setError("") // エラーをクリア

    // 終了時間が設定済みの場合、時系列チェック
    if (reservationEndTime) {
      const startHour = Number.parseInt(time.split(":")[0])
      const endHour = Number.parseInt(reservationEndTime.split(":")[0])
      if (startHour >= endHour) {
        setError("終了時間は開始時間より後に設定してください")
      }
    }
  }

  const handleEndTimeChange = (time) => {
    setReservationEndTime(time)
    setError("") // エラーをクリア

    // 開始時間が設定済みの場合、時系列チェック
    if (reservationStartTime) {
      const startHour = Number.parseInt(reservationStartTime.split(":")[0])
      const endHour = Number.parseInt(time.split(":")[0])
      if (startHour >= endHour) {
        setError("終了時間は開始時間より後に設定してください")
      }
    }
  }

  const handlePlayerClassChange = (value) => {
    setPlayerClass(value)
    setSelectedCafeGames([]) // クラス変更時に選択をリセット
  }

  const handleAddGame = (gameId) => {
    if (!selectedCafeGames.includes(gameId)) {
      setSelectedCafeGames([...selectedCafeGames, gameId])
    }
  }

  const handleRemoveGame = (gameId) => {
    setSelectedCafeGames(selectedCafeGames.filter((id) => id !== gameId))
  }

  const filteredCafeGames = useMemo(() => {
    if (!cafeGames.length) return []

    // 検索フィルタリング
    const filtered = cafeGames.filter((game) => game.name.toLowerCase().includes(cafeGameSearch.toLowerCase()))

    // 既に選択されているゲームを除外
    return filtered.filter((game) => !selectedCafeGames.includes(game.id))
  }, [cafeGames, cafeGameSearch, selectedCafeGames])

  const handleReservationSubmit = async () => {
    setError("")

    // 日付の検証
    if (!reservationDate) {
      setError("日付を選択してください")
      return
    }

    // コース選択の検証
    if (!selectedCourse) {
      setError("コースを選択してください")
      return
    }

    // カスタムコースの時間検証
    if (selectedCourse === "custom") {
      if (!reservationStartTime || !reservationEndTime) {
        setError("開始時間と終了時間を選択してください")
        return
      }

      const startHour = Number.parseInt(reservationStartTime.split(":")[0])
      const endHour = Number.parseInt(reservationEndTime.split(":")[0])

      if (startHour >= endHour) {
        setError("終了時間は開始時間より後に設定してください")
        return
      }
    }

    // 参加者募集の検証
    if (isRecruiting) {
      if (!playerClass) {
        setError("プレイヤークラスを選択してください")
        return
      }

      if (recruitmentCount < 1) {
        setError("募集人数は1人以上に設定してください")
        return
      }

      if (selectedCafeGames.length === 0) {
        setError("少なくとも1つのゲームを選択してください")
        return
      }
    }

    const reservationData = {
      cafe: selectedCafe.id,
      date: format(reservationDate, "yyyy-MM-dd"),
      course: selectedCourse,
      startTime: reservationStartTime,
      endTime: reservationEndTime,
      numberOfPeople: numberOfPeople,
      is_recruiting: isRecruiting,
      max_participants: isRecruiting ? numberOfPeople + recruitmentCount : numberOfPeople,
      cafe_games: selectedCafeGames,
      personal_games: [], // カフェからの予約では個人のゲームは使用しない
      game_class: playerClass,
    }

    try {
      const token = getToken()
      const response = await axios.post("http://localhost:8000/match/api/reservations/", reservationData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("予約が確定しました:", response.data)

      setIsModalOpen(false)
      setReservationDate(null)
      setSelectedCourse("")
      setReservationStartTime("")
      setReservationEndTime("")
      setNumberOfPeople(2)
      setIsRecruiting(false)
      setPlayerClass("")
      setRecruitmentCount(1)
      setSelectedCafeGames([])
      setError("")

      const new_reservation = await axios.get("http://localhost:8000/cafes/api/reservations/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log(new_reservation)

      // 予約リストを更新
      const parsedReservations = parseReservations(new_reservation.data)
      setReservations(parsedReservations)
    } catch (error) {
      console.error("予約の送信中にエラーが発生しました:", error)
      setError("予約の送信中にエラーが発生しました")
    }
  }

  const timeOptions = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => `${i + 13}:00`)
  }, [])

  if (!currentDate) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">カフェ予約管理</h1>
      <Tabs defaultValue="0" onValueChange={(value) => setSelectedWeek(Number.parseInt(value))}>
        <TabsList className="grid w-full grid-cols-5">
          {weeks.map((week, index) => (
            <TabsTrigger key={index} value={index.toString()}>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {format(week[0], "M/d", { locale: ja })} - {format(week[6], "M/d", { locale: ja })}
                </div>
                <div className="text-xs">{index === 0 ? "今週" : `${index + 1}週間後`}</div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {weeks.map((week, weekIndex) => (
          <TabsContent key={weekIndex} value={weekIndex.toString()}>
            {week.map((day) => (
              <Card key={day.toISOString()} className="mb-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{format(day, "yyyy年M月d日 (EEEE)", { locale: ja })}</CardTitle>
                  <Button onClick={() => handleReservationClick(cafeData, day)}>予約</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-[auto,1fr] gap-4 overflow-x-auto">
                    <div></div>
                    <div className="grid grid-cols-10 gap-0 border-b border-gray-200">
                      {HOURS.map((hour) => (
                        <div key={hour} className="text-center text-sm font-medium py-2">
                          {hour}:00
                        </div>
                      ))}
                    </div>

                    {tables.map((table) => (
                      <React.Fragment key={table.id}>
                        <div className="flex items-center justify-end pr-4 font-medium">{table.name}</div>
                        <div className="grid grid-cols-10 gap-0 border-b border-gray-200 relative">
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className={`h-16 border-r border-gray-200 ${
                                !isWithinBusinessHours(day, hour) ? "bg-gray-200" : ""
                              }`}
                            ></div>
                          ))}

                          {reservations
                            .filter((res) => {
                              const reservationDate = parseISO(res.date)
                              return isSameDay(reservationDate, day) && res.tableIds.includes(table.id)
                            })
                            .map((reservation) => {
                              const startTime = format(parseISO(reservation.startTime), "HH:mm")
                              const endTime = format(parseISO(reservation.endTime), "HH:mm")
                              const participantsText = reservation.participants.slice(0, 3).join(", ")
                              const extraParticipants =
                                reservation.participants.length > 3 ? ` +${reservation.participants.length - 3}` : ""

                              return (
                                <div
                                  key={reservation.id}
                                  style={getReservationStyle(reservation)}
                                  title={`予約 #${reservation.id} (${startTime}-${endTime})
参加者: ${reservation.participants.join(", ")}`}
                                >
                                  <div className="text-xs font-semibold">
                                    {startTime}-{endTime}
                                  </div>
                                  <div className="text-xs truncate">
                                    {participantsText}
                                    {extraParticipants}
                                  </div>
                                  <div className="text-xs">
                                    {reservation.reservationType === "user" ? "予約" : "管理者予約"} #{reservation.id}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>予約</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cafe" className="text-right">
                カフェ
              </Label>
              <Input id="cafe" value={selectedCafe?.name || ""} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                日付
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !reservationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reservationDate ? format(reservationDate, "PPP", { locale: ja }) : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reservationDate}
                    onSelect={setReservationDate}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">
                コース
              </Label>
              <Select onValueChange={handleCourseChange} value={selectedCourse}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="コースを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="afternoon">13時～18時コース</SelectItem>
                  <SelectItem value="evening">18時～23時コース</SelectItem>
                  <SelectItem value="custom">カスタム</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedCourse === "custom" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    開始時間
                  </Label>
                  <Select onValueChange={handleStartTimeChange} value={reservationStartTime}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="開始時間を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    終了時間
                  </Label>
                  <Select onValueChange={handleEndTimeChange} value={reservationEndTime}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="終了時間を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(1).map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="people" className="text-right">
                人数
              </Label>
              <Input
                id="people"
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Number.parseInt(e.target.value))}
                min={1}
                className="col-span-3"
              />
            </div>

            {/* 参加者募集セクション */}
            {(selectedCourse === "afternoon" || selectedCourse === "evening") && (
              <>
                <div className="flex flex-col items-center justify-center py-4 border-t border-b my-2">
                  <div className="flex items-center gap-4 mb-4">
                    <Label htmlFor="recruiting" className="text-base font-medium">
                      参加者を募集する
                    </Label>
                    <Switch
                      id="recruiting"
                      checked={isRecruiting}
                      onCheckedChange={setIsRecruiting}
                      className="scale-125"
                    />
                  </div>
                </div>

                {isRecruiting && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="playerClass" className="text-right">
                        クラス
                      </Label>
                      <Select onValueChange={handlePlayerClassChange} value={playerClass}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="クラスを選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">軽量級</SelectItem>
                          <SelectItem value="medium">中量級</SelectItem>
                          <SelectItem value="heavy">重量級</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recruitmentCount" className="text-right">
                        募集人数
                      </Label>
                      <Input
                        id="recruitmentCount"
                        type="number"
                        value={recruitmentCount}
                        onChange={(e) => setRecruitmentCount(Number.parseInt(e.target.value))}
                        min={1}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">ゲーム</Label>
                      <div className="col-span-3">
                        <div className="space-y-4">
                          {selectedCafeGames.length > 0 && (
                            <div>
                              <Label className="mb-2 block">選択したゲーム</Label>
                              <div className="space-y-1 mb-4">
                                {selectedCafeGames.map((gameId) => {
                                  const game = cafeGames.find((g) => g.id === gameId)
                                  return (
                                    <div
                                      key={`cafe-${gameId}`}
                                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                                    >
                                      <span>{game?.name} (カフェ)</span>
                                      <Button variant="ghost" size="sm" onClick={() => handleRemoveGame(gameId)}>
                                        削除
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <Input
                                placeholder="カフェのゲームを検索..."
                                value={cafeGameSearch}
                                onChange={(e) => setCafeGameSearch(e.target.value)}
                                className="mb-2"
                              />
                              <div className="max-h-[30vh] overflow-y-auto border rounded-md">
                                {filteredCafeGames.length > 0 ? (
                                  <div className="p-1">
                                    {filteredCafeGames.map((game) => (
                                      <div
                                        key={game.id}
                                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                                        onClick={() => handleAddGame(game.id)}
                                      >
                                        <span>{game.name}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAddGame(game.id)
                                          }}
                                        >
                                          追加
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-2 text-center text-muted-foreground">
                                    {cafeGameSearch ? "該当するゲームがありません" : "すべてのゲームが選択されています"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleReservationSubmit}>
              予約を確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

