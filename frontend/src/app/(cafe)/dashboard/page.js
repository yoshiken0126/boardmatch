"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, addWeeks, startOfWeek, addDays, isSameDay, set, parseISO, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// トークン取得関数のインポート（別ファイルで定義されていると仮定）
import { getToken } from '@/lib/auth';

export const HOURS = Array.from({ length: 10 }, (_, i) => i + 13);

// 予約バーのスタイルを計算する関数
export function getReservationStyle(reservation) {
  const startTime = parseISO(reservation.startTime);
  const endTime = parseISO(reservation.endTime);

  // タイムラインの開始時間（13:00）からの経過分数を計算
  const timelineStart = set(startTime, { hours: 13, minutes: 0, seconds: 0 });
  const startOffset = differenceInMinutes(startTime, timelineStart);
  const endOffset = differenceInMinutes(endTime, timelineStart);
  
  // タイムラインの全幅は10時間（600分）
  const totalMinutes = 10 * 60;
  
  // パーセンテージ位置を計算
  const leftPosition = (startOffset / totalMinutes) * 100;
  const width = ((endOffset - startOffset) / totalMinutes) * 100;

  // 幅が負にならないようにする
  if (width < 0) {
    return {}; // 無効な幅の場合は空のオブジェクトを返す
  }

  // 予約バーの幅を少し縮小し、マージンを追加
  const marginPercentage = 0.5; // 0.5%のマージン（両側で合計1%）
  const adjustedWidth = width - (marginPercentage * 2);
  const adjustedLeft = leftPosition + marginPercentage;

  const minWidth = 0.5; // 最小幅を0.5%に設定
  const finalWidth = Math.max(adjustedWidth, minWidth);

  return {
    position: 'absolute',
    left: `${adjustedLeft}%`,
    width: `${finalWidth}%`,
    height: '80%',
    top: '10%',
    backgroundColor: reservation.reservationType === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
    borderRadius: '4px',
    color: 'hsl(var(--primary-foreground))',
    padding: '4px',
    fontSize: '0.75rem',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', // 影を追加してさらに区別しやすくする
  };
}

const parseReservations = (reservationsData) => {
  return reservationsData.map(reservation => {
    // 参加者の名前を抽出する処理を更新
    const participantNames = Array.isArray(reservation.participants) 
      ? reservation.participants.map(participant => {
        // 参加者オブジェクトから'user'プロパティを抽出
        return participant.user || 'Unknown';
      })
      : [];

    return {
      id: reservation.id || Math.random().toString(36).substr(2, 9),
      tableId: reservation.table,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      date: format(parseISO(reservation.start_time), 'yyyy-MM-dd'),
      cafe: reservation.cafe,
      reservationType: reservation.reservation_type,
      participants: participantNames
    };
  });
};

export default function CafeReservation() {
  // (以前のコンポーネントコードは全て同じです)
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [cafeData, setCafeData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);

  // (以下、前回提示したコンポーネントの残りのコードと全く同じです)
  const weeks = useMemo(() => {
    if (!currentDate) return [];
    return Array.from({ length: 5 }, (_, i) => {
      const weekStart = startOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j));
    });
  }, [currentDate]);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const token = getToken();
        const response = await axios.get('http://localhost:8000/cafes/api/tables/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTables(response.data.map(table => ({
          id: table.id,
          name: table.table_name
        })));
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError('テーブル情報の取得に失敗しました。');
      }
    };

    fetchTables();
  }, []);

  useEffect(() => {
    const fetchBoardGameCafe = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:8000/cafes/api/boardgamecafes/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch board game cafe data');
        }
        const data = await response.json();
        setCafeData(data[0]);
      } catch (err) {
        console.error('Error fetching board game cafe data:', err);
        setCafeData(null);
      }
    };

    fetchBoardGameCafe();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = getToken();
        const response = await axios.get('http://localhost:8000/cafes/api/reservations/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const parsedReservations = parseReservations(response.data);
        setReservations(parsedReservations);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('予約情報の取得に失敗しました。');
      }
    };

    fetchReservations();
  }, []);

  const isWithinBusinessHours = (day, hour) => {
    if (!cafeData) return false;

    const dayOfWeek = format(day, 'EEEE').toLowerCase();
    const openTimeKey = `${dayOfWeek}_open`;
    const closeTimeKey = `${dayOfWeek}_close`;

    const openTime = cafeData[openTimeKey];
    const closeTime = cafeData[closeTimeKey];

    if (openTime === null || closeTime === null) return false;

    const currentTime = set(day, { hours: hour, minutes: 0, seconds: 0 });
    const openDateTime = set(day, {
      hours: parseInt(openTime.split(':')[0]),
      minutes: parseInt(openTime.split(':')[1]),
      seconds: 0
    });
    const closeDateTime = set(day, {
      hours: parseInt(closeTime.split(':')[0]),
      minutes: parseInt(closeTime.split(':')[1]),
      seconds: 0
    });

    if (closeDateTime < openDateTime) {
      if (hour < parseInt(openDateTime.getHours())) {
        return false;
      }
      closeDateTime.setDate(closeDateTime.getDate() + 1);
    }

    return currentTime >= openDateTime && currentTime < closeDateTime;
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!currentDate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">カフェ予約管理</h1>
      <Tabs defaultValue="0" onValueChange={(value) => setSelectedWeek(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-5">
          {weeks.map((week, index) => (
            <TabsTrigger key={index} value={index.toString()}>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {format(week[0], 'M/d', { locale: ja })} - {format(week[6], 'M/d', { locale: ja })}
                </div>
                <div className="text-xs">
                  {index === 0 ? '今週' : `${index + 1}週間後`}
                </div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {weeks.map((week, weekIndex) => (
          <TabsContent key={weekIndex} value={weekIndex.toString()}>
            {week.map((day) => (
              <Card key={day.toISOString()} className="mb-4">
                <CardHeader>
                  <CardTitle>{format(day, 'yyyy年M月d日 (EEEE)', { locale: ja })}</CardTitle>
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
                                !isWithinBusinessHours(day, hour) ? 'bg-gray-200' : ''
                              }`}
                            ></div>
                          ))}

                          {reservations
                            .filter((res) => {
                              const reservationDate = parseISO(res.date);
                              return isSameDay(reservationDate, day) && res.tableId === table.id;
                            })
                            .map((reservation) => {
                              const startTime = format(parseISO(reservation.startTime), 'HH:mm');
                              const endTime = format(parseISO(reservation.endTime), 'HH:mm');
                              const participantsText = reservation.participants.slice(0, 3).join(', ');
                              const extraParticipants = reservation.participants.length > 3 ? ` +${reservation.participants.length - 3}` : '';

                              return (
                                <div
                                  key={reservation.id}
                                  style={getReservationStyle(reservation)}
                                  title={`予約 #${reservation.id} (${startTime}-${endTime})
参加者: ${reservation.participants.join(', ')}`}
                                >
                                  <div className="text-xs font-semibold">{startTime}-{endTime}</div>
                                  <div className="text-xs truncate">
                                    {participantsText}{extraParticipants}
                                  </div>
                                  <div className="text-xs">
                                    {reservation.reservationType === 'user' ? '予約' : '管理者予約'} #{reservation.id}
                                  </div>
                                </div>
                              );
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
    </div>
  );
}