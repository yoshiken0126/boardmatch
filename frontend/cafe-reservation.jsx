"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { getToken } from "@/lib/auth"

export default function Home() {
  const [cafes, setCafes] = useState([])
  const [userCafes, setUserCafes] = useState([])
  const token = getToken()
  const [switchStates, setSwitchStates] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [reservationDate, setReservationDate] = useState(new Date())
  const [reservationStartTime, setReservationStartTime] = useState("")
  const [reservationEndTime, setReservationEndTime] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState(1)

  useEffect(() => {
    axios
      .get("http://localhost:8000/match/api/cafe_list/")
      .then((response) => {
        setCafes(response.data)
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
          }
        )
        console.log("関係が更新されました:", response.data)

        setUserCafes((prevUserCafes) =>
          prevUserCafes.map((relation) =>
            relation.id === existingRelation.id ? { ...relation, can_visit: checked } : relation))
      } else {
        const response = await axios.post(
          "http://localhost:8000/match/api/user_cafe_relations/",
          { cafe: cafeId, can_visit: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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
  }

  const handleReservationSubmit = () => {
    console.log("予約が送信されました:", {
      cafe: selectedCafe,
      date: reservationDate,
      startTime: reservationStartTime,
      endTime: reservationEndTime,
      people: numberOfPeople,
    })
    setIsModalOpen(false)
    setReservationDate(new Date())
    setReservationStartTime("")
    setReservationEndTime("")
    setNumberOfPeople(1)
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0")
    return `${hour}:00`
  })

  return (
    (<div>
      {cafes.length === 0 ? (
        <p>登録されているカフェはありません</p>
      ) : (
        <ul>
          {cafes.map((cafe) => (
            <Card key={cafe.id} className="relative mb-4">
              <CardHeader className="text-2xl font-bold rounded">
                <div className="flex items-center">
                  <span>{cafe.name}</span>
                  <Button
                    onClick={() => handleReservationClick(cafe)}
                    className="ml-2 text-sm bg-black text-white hover:bg-gray-800"
                    size="sm">
                    予約
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>{cafe.description || "このカフェの詳細情報はありません。"}</p>
                <div className="absolute top-4 right-4">
                  <Switch
                    checked={switchStates[cafe.id] || false}
                    onCheckedChange={(checked) => handleSwitchChange(cafe.id, checked)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cafe" className="text-right">
                カフェ
              </Label>
              <Input
                id="cafe"
                value={selectedCafe?.name || ""}
                className="col-span-3"
                disabled />
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
                      !reservationDate && "text-muted-foreground"
                    )}>
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
                    locale={ja} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                開始時間
              </Label>
              <Select onValueChange={setReservationStartTime} value={reservationStartTime}>
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
              <Select onValueChange={setReservationEndTime} value={reservationEndTime}>
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
                className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleReservationSubmit}>
              予約を確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>)
  );
}

