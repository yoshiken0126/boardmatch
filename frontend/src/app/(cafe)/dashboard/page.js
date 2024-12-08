import React from 'react';
import { format, parseISO } from 'date-fns';

// Sample reservation data (you would typically fetch this from an API)
const initialReservations = [
  { 
    tableId: 1, 
    startTime: '2024-02-15T15:00:00', 
    endTime: '2024-02-15T16:30:00',
    customerName: 'John Doe'
  },
  { 
    tableId: 2, 
    startTime: '2024-02-15T18:00:00', 
    endTime: '2024-02-15T20:00:00',
    customerName: 'Jane Smith'
  }
];

export default function CafeReservationPage() {
  // Generate time slots from 13:00 to 23:00
  const timeSlots = Array.from({ length: 11 }, (_, i) => 13 + i);
  
  // Number of tables (you can adjust this)
  const tables = Array.from({ length: 5 }, (_, i) => i + 1);

  // Calculate position and width of reservation bars
  const calculateReservationStyle = (startTime, endTime) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    // Calculate start position (percentage from 13:00)
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const startPosition = ((startHour - 13 + startMinute / 60) / 10) * 100;
    
    // Calculate width (percentage of time duration)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const width = (durationHours / 10) * 100;

    return {
      position: 'absolute',
      left: `${startPosition}%`,
      width: `${width}%`,
      height: '80%',
      backgroundColor: 'rgba(0, 123, 255, 0.7)',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '0.8rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">カフェ予約管理</h1>
      
      {/* Time Header */}
      <div className="flex mb-2">
        <div className="w-20 mr-4"></div>
        <div className="flex-grow relative h-10">
          {timeSlots.map((hour) => (
            <div 
              key={hour} 
              className="absolute text-sm text-gray-600"
              style={{ 
                left: `${((hour - 13) / 10) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      {/* Tables and Reservations */}
      {tables.map((tableId) => (
        <div 
          key={tableId} 
          className="flex items-center border-b py-2"
        >
          {/* Table Label */}
          <div className="w-20 mr-4 font-medium">
            テーブル {tableId}
          </div>

          {/* Timeline */}
          <div 
            className="flex-grow relative h-12 bg-gray-100 rounded"
            style={{ position: 'relative' }}
          >
            {/* Reservation Bars */}
            {initialReservations
              .filter(res => res.tableId === tableId)
              .map((reservation, index) => (
                <div 
                  key={index}
                  style={calculateReservationStyle(
                    reservation.startTime, 
                    reservation.endTime
                  )}
                >
                  {reservation.customerName}
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}