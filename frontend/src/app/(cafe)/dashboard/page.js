"use client";

import React, { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const HOURS = Array.from({ length: 11 }, (_, i) => i + 13);

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
    left: `${(start / (10 * 60)) * 100}%`,
    width: `${(duration / (10 * 60)) * 100}%`,
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

const tables = [
  { id: 1, name: 'テーブル1' },
  { id: 2, name: 'テーブル2' },
  { id: 3, name: 'テーブル3' },
  { id: 4, name: 'テーブル4' },
  { id: 5, name: 'テーブル5' },
];

const mockReservations = [
  { id: '1', tableId: 1, startTime: '14:00', endTime: '16:00', customerName: '山田太郎', date: '2024-12-09' },
  { id: '2', tableId: 3, startTime: '18:30', endTime: '20:00', customerName: '佐藤花子', date: '2024-12-10' },
  { id: '3', tableId: 2, startTime: '13:30', endTime: '15:30', customerName: '鈴木一郎', date: '2024-12-11' },
];

export default function CafeReservation() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const currentDate = new Date();

  const weeks = Array.from({ length: 5 }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j));
  });

  useEffect(() => {
    // mockReservationsの変更に伴い、必要であればログを表示（今回は削除しました）
  }, [mockReservations]);

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
                    <div className="grid grid-cols-11 gap-0 border-b border-gray-200">
                      {HOURS.map((hour) => (
                        <div key={hour} className="text-center text-sm font-medium py-2">
                          {hour}:00
                        </div>
                      ))}
                    </div>

                    {tables.map((table) => (
                      <React.Fragment key={table.id}>
                        <div className="flex items-center justify-end pr-4 font-medium">{table.name}</div>
                        <div className="grid grid-cols-11 gap-0 border-b border-gray-200 relative">
                          {HOURS.map((hour) => (
                            <div key={hour} className="h-16 border-r border-gray-200"></div>
                          ))}

                          {mockReservations
                            .filter((res) => {
                              const reservationDate = new Date(res.date);
                              const dayDate = new Date(day);

                              // 予約と日付が一致し、テーブルが一致する場合のみ
                              if (isSameDay(reservationDate, dayDate) && res.tableId === table.id) {
                                // ログを条件が一致した場合のみ表示
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
