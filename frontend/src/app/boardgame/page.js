'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle,CardDescription,CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Navbar from '@/components/navbar'

export default function Home() {
  const[boardgames,setBoardgames] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/match/api/')
      .then(response => {
        setBoardgames(response.data);
      })
      .catch(error => {
        console.error("エラー発生", error);
      });
  },[]);

  return(
    <div>
     <div> <Navbar /></div>
      {boardgames.length === 0 ?(
        <p>ボードゲームは登録されていません</p>
      ) : (
        <ul>
          {boardgames.map(boardgame => (
            <Card key={boardgame.id} className="relative">
              <CardHeader className='text-2xl font-bold rounded'>{boardgame.name}</CardHeader>
              <CardContent>こんなかんじでどうでしょう。改行ってどうやるんだろ？分からんけどまあいい感じに説明できるといいよね。</CardContent>
              <div className="absolute top-4 right-4">
              <Switch />
              </div>
              </Card>
          ))}
        </ul>
      )}
    </div>
  );

  
}