"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getToken } from "@/lib/auth"
import { addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns"

export default function Home() {
  const [cafes, setCafes] = useState([])
  const [userCafes, setUserCafes] = useState([])
  const token = getToken()
  const [switchStates, setSwitchStates] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [reservationDate, setReservationDate] = useState(null)
  const [reservationStartTime, setReservationStartTime] = useState("")
  const [reservationEndTime, setReservationEndTime] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [error, setError] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [isRecruiting, setIsRecruiting] = useState(false)
  const [recruitmentCount, setRecruitmentCount] = useState(1)
  const [selectedCafeGames, setSelectedCafeGames] = useState([])
  const [selectedPersonalGames, setSelectedPersonalGames] = useState([])
  const [cafeGames, setCafeGames] = useState([])
  const [personalGames, setPersonalGames] = useState([])
  const [cafeGameSearch, setCafeGameSearch] = useState("")
  const [personalGameSearch, setPersonalGameSearch] = useState("")
  const [activeGameTab, setActiveGameTab] = useState("cafe")
  const [playerClass, setPlayerClass] = useState("")

  useEffect(() => {
    axios
      .get("http://localhost:8000/match/api/cafe_list/")
      .then((response) => {
        setCafes(response.data)
        console.log(response)
      })
      .catch((error) => {
        console.error("カフェリストの取得中にエラーが発生しました:", error)
      })

    axios
      .get("http://localhost:8000/match/api/user_cafe_relations/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUserCafes(response.data)
        const initialSwitchStates = response.data.reduce((acc, cafe) => {
          acc[cafe.cafe] = cafe.can_visit
          return acc
        }, {})
        setSwitchStates(initialSwitchStates)
      })
      .catch((error) => {
        console.error("ユーザーのカフェ関係の取得中にエラーが発生しました:", error)
      })
  }, [token])

  const fetchGamesByPlayerClass = async (cafeId, playerClass) => {
    try {
      const [cafeGamesResponse, personalGamesResponse] = await Promise.all([
        axios.get(`http://localhost:8000/match/api/cafe_have_games/${cafeId}/${playerClass}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:8000/match/api/user_have_games/${playerClass}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setCafeGames(cafeGamesResponse.data)
      setPersonalGames(personalGamesResponse.data)
    } catch (error) {
      console.error("ゲームリストの取得中にエラーが発生しました:", error)
      setError("ゲームリストの取得中にエラーが発生しました")
    }
  }

  const handleSwitchChange = async (cafeId, checked) => {
    try {
      const existingRelation = userCafes.find((relation) => relation.cafe === cafeId)

      if (existingRelation) {
        const response = await axios.patch(
          `http://localhost:8000/match/api/user_cafe_relations/${existingRelation.id}/`,
          { can_visit: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        console.log("関係が更新されました:", response.data)

        setUserCafes((prevUserCafes) =>
          prevUserCafes.map((relation) =>
            relation.id === existingRelation.id ? { ...relation, can_visit: checked } : relation,
          ),
        )
      } else {
        const response = await axios.post(
          "http://localhost:8000/match/api/user_cafe_relations/",
          { cafe: cafeId, can_visit: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        console.log("新しい関係が作成されました:", response.data)

        setUserCafes((prevUserCafes) => [...prevUserCafes, response.data])
      }

      setSwitchStates((prev) => ({
        ...prev,
        [cafeId]: checked,
      }))
    } catch (error) {
      console.error("関係の更新中にエラーが発生しました:", error)
      setSwitchStates((prev) => ({
        ...prev,
        [cafeId]: !checked,
      }))
    }
  }

  const handleReservationClick = (cafe) => {
    setSelectedCafe(cafe)
    setIsModalOpen(true)
    setReservationDate(null)
    setSelectedCourse("")
    setReservationStartTime("")
    setReservationEndTime("")
    setNumberOfPeople(2)
    setIsRecruiting(false)
    setRecruitmentCount(1)
    setSelectedCafeGames([])
    setSelectedPersonalGames([])
    setError("")
    setAlertMessage("")
    setPlayerClass("")
  }

  const handleReservationSubmit = async () => {
    setError("")
    setAlertMessage("")

    if (!reservationDate) {
      setError("日付を選択してください")
      return
    }

    if (!selectedCourse) {
      setError("コースを選択してください")
      return
    }

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

    // 参加者募集のバリデーション
    if (isRecruiting) {
      if (recruitmentCount < 1) {
        setError("募集人数を1人以上に設定してください")
        return
      }

      if (selectedCafeGames.length === 0 && selectedPersonalGames.length === 0) {
        setError("少なくとも1つのゲームを選択してください")
        return
      }

      if (!playerClass) {
        setError("プレイヤークラスを選択してください")
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
      personal_games: selectedPersonalGames,
      game_class: playerClass,
    }

    try {
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
      setRecruitmentCount(1)
      setSelectedCafeGames([])
      setSelectedPersonalGames([])
      setError("")
      setAlertMessage("")
      setPlayerClass("")

      window.location.reload()
    } catch (error) {
      console.error("予約の送信中にエラーが発生しました:", error)
      console.log(error.response.data);
      setError("予約の送信中にエラーが発生しました")
    }
  }

  const handleCourseChange = (course) => {
    setSelectedCourse(course)
    setError("")
    setAlertMessage("")
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
    setError("")
    setAlertMessage("")

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
    setError("")
    setAlertMessage("")

    if (reservationStartTime) {
      const startHour = Number.parseInt(reservationStartTime.split(":")[0])
      const endHour = Number.parseInt(time.split(":")[0])
      if (startHour >= endHour) {
        setError("終了時間は開始時間より後に設定してください")
      }
    }
  }

  const timeOptions = Array.from({ length: 11 }, (_, i) => {
    const hour = (i + 13).toString().padStart(2, "0")
    return `${hour}:00`
  })

  const getMaxGamesAllowed = (playerClass) => {
    switch (playerClass) {
      case "light":
        return 4
      case "medium":
        return 2
      case "heavy":
        return 1
      default:
        return 0
    }
  }

  const handleAddGame = (gameId, type) => {
    const totalSelectedGames = selectedCafeGames.length + selectedPersonalGames.length
    const maxGamesAllowed = getMaxGamesAllowed(playerClass)

    if (totalSelectedGames >= maxGamesAllowed) {
      setAlertMessage(
        `${playerClass === "light" ? "軽量級" : playerClass === "medium" ? "中量級" : "重量級"}では最大${maxGamesAllowed}つのゲームしか選択できません。`,
      )
      return
    }

    if (type === "cafe") {
      if (!selectedCafeGames.includes(gameId)) {
        setSelectedCafeGames((prev) => [...prev, gameId])
      }
    } else {
      if (!selectedPersonalGames.includes(gameId)) {
        setSelectedPersonalGames((prev) => [...prev, gameId])
      }
    }
  }

  const handleRemoveGame = (gameId, type) => {
    if (type === "cafe") {
      setSelectedCafeGames((prev) => prev.filter((id) => id !== gameId))
    } else {
      setSelectedPersonalGames((prev) => prev.filter((id) => id !== gameId))
    }
  }

  const handlePlayerClassChange = async (newClass) => {
    setPlayerClass(newClass)
    setSelectedCafeGames([])
    setSelectedPersonalGames([])
    setAlertMessage(
      "プレイヤークラスが変更されました。選択されていたゲームがリセットされました。新しいクラスに応じてゲームを選び直してください。",
    )
    if (selectedCafe) {
      await fetchGamesByPlayerClass(selectedCafe.id, newClass)
    }
  }

  const filteredCafeGames = cafeGames.filter(
    (game) => game.name.toLowerCase().includes(cafeGameSearch.toLowerCase()) && !selectedCafeGames.includes(game.id),
  )

  const filteredPersonalGames = personalGames.filter(
    (game) =>
      game.name.toLowerCase().includes(personalGameSearch.toLowerCase()) && !selectedPersonalGames.includes(game.id),
  )

  const getClosedDays = (cafe) => {
    const days = ["月", "火", "水", "木", "金", "土", "日"]
    const closedDays = []

    if (cafe.monday_open === null) closedDays.push("月")
    if (cafe.tuesday_open === null) closedDays.push("火")
    if (cafe.wednesday_open === null) closedDays.push("水")
    if (cafe.thursday_open === null) closedDays.push("木")
    if (cafe.friday_open === null) closedDays.push("金")
    if (cafe.saturday_open === null) closedDays.push("土")
    if (cafe.sunday_open === null) closedDays.push("日")

    return closedDays.length > 0 ? closedDays.join("、") : "なし"
  }

  const today = new Date()
  const startDate = startOfWeek(today, { weekStartsOn: 1 })
  const endDate = addDays(endOfWeek(startOfWeek(addDays(startDate, 35), { weekStartsOn: 1 }), { weekStartsOn: 1 }), 1)

  const isDateInRange = (date) => {
    return isWithinInterval(date, { start: today, end: endDate })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {cafes.length === 0 ? (
        <p>登録されているカフェはありません</p>
      ) : (
        <ul>
          {cafes.map((cafe) => (
            <Card key={cafe.id} className="relative mb-4">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/4 p-2 flex items-center justify-center" style={{ height: "150px" }}>
                  <div
                    className="w-full h-full bg-gray-300"
                    style={{
                      backgroundImage: cafe.image1 ? `url(${cafe.image1})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
                <div className="w-full sm:w-3/4">
                  <CardContent className="py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <Button
                          onClick={() => handleReservationClick(cafe)}
                          className="mb-2 sm:mb-0 sm:mr-2 text-sm bg-black text-white hover:bg-gray-800"
                          size="sm"
                        >
                          予約
                        </Button>
                        <span className="text-xl font-bold">{cafe.name}</span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 sm:top-6 sm:right-6">
                      <Switch
                        checked={switchStates[cafe.id] || false}
                        onCheckedChange={(checked) => handleSwitchChange(cafe.id, checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                      <p className="mr-4">
                        営業時間: {cafe.opening_time.slice(0, 5)}～{cafe.closing_time.slice(0, 5)}
                      </p>
                      <p>定休日: {getClosedDays(cafe)}</p>
                    </div>
                    <p>
                      住所: {cafe.prefecture_name} {cafe.city}
                    </p>
                    <p className="ml-0 sm:ml-8">
                      {cafe.address} {cafe.building}
                    </p>
                    <p>アクセス: {cafe.walking_minutes}</p>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}

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
          {alertMessage && (
            <Alert variant="destructive">
              <AlertDescription>{alertMessage}</AlertDescription>
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
                    weekStartsOn={1}
                    fromDate={today}
                    toDate={endDate}
                    modifiers={{ inRange: isDateInRange }}
                    modifiersStyles={{
                      inRange: { backgroundColor: "var(--primary-100)", color: "var(--primary-900)" },
                    }}
                    className="rounded-md border"
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
                      {timeOptions.map((time) => (
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
                min={2}
                className="col-span-3"
              />
            </div>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="playerClass" className="text-right">
                        プレイヤークラス
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
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">プレイするゲーム</Label>
                      <div className="col-span-3">
                        <div className="space-y-4">
                          {(selectedCafeGames.length > 0 || selectedPersonalGames.length > 0) && (
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
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveGame(gameId, "cafe")}
                                      >
                                        削除
                                      </Button>
                                    </div>
                                  )
                                })}
                                {selectedPersonalGames.map((gameId) => {
                                  const game = personalGames.find((g) => g.id === gameId)
                                  return (
                                    <div
                                      key={`personal-${gameId}`}
                                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                                    >
                                      <span>{game?.name} (持ち込み)</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveGame(gameId, "personal")}
                                      >
                                        削除
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <Tabs defaultValue="cafe" className="w-full" onValueChange={setActiveGameTab}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="cafe">カフェのゲーム</TabsTrigger>
                              <TabsTrigger value="personal">持ち込みゲーム</TabsTrigger>
                            </TabsList>
                            <TabsContent value="cafe">
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
                                            onClick={() => handleAddGame(game.id, "cafe")}
                                          >
                                            <span>{game.name}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleAddGame(game.id, "cafe")
                                              }}
                                            >
                                              追加
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-2 text-center text-muted-foreground">
                                        {cafeGameSearch
                                          ? "該当するゲームがありません"
                                          : "すべてのゲームが選択されています"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="personal">
                              <div className="space-y-4">
                                <div>
                                  <Input
                                    placeholder="持ち込みゲームを検索..."
                                    value={personalGameSearch}
                                    onChange={(e) => setPersonalGameSearch(e.target.value)}
                                    className="mb-2"
                                  />
                                  <div className="max-h-[30vh] overflow-y-auto border rounded-md">
                                    {filteredPersonalGames.length > 0 ? (
                                      <div className="p-1">
                                        {filteredPersonalGames.map((game) => (
                                          <div
                                            key={game.id}
                                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                                            onClick={() => handleAddGame(game.id, "personal")}
                                          >
                                            <span>{game.name}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleAddGame(game.id, "personal")
                                              }}
                                            >
                                              追加
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-2 text-center text-muted-foreground">
                                        {personalGameSearch
                                          ? "該当するゲームがありません"
                                          : "すべてのゲームが選択されています"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
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

