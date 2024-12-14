"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addWeeks, startOfWeek, addDays, isSameDay, isWithinInterval, set, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import the getToken function (assuming it's defined in a separate file)
import { getToken } from '@/lib/auth';

export const HOURS = Array.from({ length: 10 }, (_, i) => i + 13);

// 予約バーのスタイルを計算する関数
export function getReservationStyle(reservation) {
  const startHour = parseInt(reservation.startTime.split(':')[0]);
  const endHour = parseInt(reservation.endTime.split(':')[0]);
  const startMinutes = parseInt(reservation.startTime.split(':')[1]);
  const endMinutes = parseInt(reservation.endTime.split(':')[1]);

  const start = (startHour - 13) * 60 + startMinutes;
  const duration = (endHour - startHour) * 60 + (endMinutes - startMinutes);

  return {
    position: 'absolute',
    left: `${(start / (9 * 60)) * 100}%`,
    width: `${(duration / (9 * 60)) * 100}%`,
    height: '80%',
    top: '10%',
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: '4px',
    color: 'hsl(var(--primary-foreground))',
    padding: '4px',
    fontSize: '0.75rem',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  };
}

const mockReservations = [
  { id: '1', tableId: 1, startTime: '14:00', endTime: '16:00', customerName: '山田太郎', date: '2024-12-09' },
  { id: '2', tableId: 3, startTime: '18:30', endTime: '20:00', customerName: '佐藤花子', date: '2024-12-10' },
  { id: '3', tableId: 2, startTime: '13:30', endTime: '15:30', customerName: '鈴木一郎', date: '2024-12-11' },
];

export default function CafeReservation() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [cafeData, setCafeData] = useState(null);
  const currentDate = new Date();

  const weeks = Array.from({ length: 5 }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j));
  });

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const token = getToken(); // Get the token
        const response = await axios.get('http://localhost:8000/cafes/api/tables/', {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request headers
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
        const token = getToken(); // Get the token
        const response = await fetch('http://localhost:8000/cafes/api/boardgamecafes/', {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request headers
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch board game cafe data');
        }
        const data = await response.json();
        console.log('Board Game Cafe Data:', data); // Log the fetched data to the console
        setCafeData(data[0]);
      } catch (err) {
        console.error('Error fetching board game cafe data:', err);
        setCafeData(null); // Explicitly set to null if fetch fails
      }
    };

    fetchBoardGameCafe();
  }, []);

  const isWithinBusinessHours = (day, hour) => {
    // cafeDataがnullまたは未定義の場合は休業
    if (!cafeData) return false;

    const dayOfWeek = format(day, 'EEEE').toLowerCase();
    const openTimeKey = `${dayOfWeek}_open`;
    const closeTimeKey = `${dayOfWeek}_close`;

    // 特定の曜日の開店・閉店時間がnullの場合は休業日
    const openTime = cafeData[openTimeKey];
    const closeTime = cafeData[closeTimeKey];

    // 開店時間または閉店時間がnullの場合は休業
    if (openTime === null || closeTime === null) return false;

    // 開店時間または閉店時間が未定義の場合も休業
    if (!openTime || !closeTime) return false;

    // 開店時間と閉店時間の解析
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

    // 閉店時間が開店時間より前の場合（深夜営業）の処理
    if (closeDateTime < openDateTime) {
      if (hour < parseInt(openDateTime.getHours())) {
        return false;
      }
      closeDateTime.setDate(closeDateTime.getDate() + 1);
    }

    // 営業時間内かどうかを判定
    return currentTime >= openDateTime && currentTime < closeDateTime;
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
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

                          {mockReservations
                            .filter((res) => {
                              const reservationDate = new Date(res.date);
                              const dayDate = new Date(day);

                              if (isSameDay(reservationDate, dayDate) && res.tableId === table.id) {
                                console.log(`Rendering reservation for table: ${table.name}, Customer: ${res.customerName}`);
                                return true;
                              }

                              return false;
                            })
                            .map((reservation) => (
                              <div
                                key={reservation.id}
                                style={getReservationStyle(reservation)}
                                title={`${reservation.customerName} (${reservation.startTime}-${reservation.endTime})`}
                              >
                                {reservation.customerName}
                              </div>
                            ))}
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
