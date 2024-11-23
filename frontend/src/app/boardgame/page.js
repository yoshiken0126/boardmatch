'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle,CardDescription,CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Navbar from '@/components/navbar'
import { useAuth } from '../context/AuthContext';
import { getToken } from '@/lib/auth';

export default function Home() {
  const[boardgames,setBoardgames] = useState([]);
  const [userBoardGames, setUserBoardGames] = useState([]);
  const token = getToken();
  const [switchStates, setSwitchStates] = useState({});
  
  useEffect(() => {
   
    axios.get('http://localhost:8000/match/api/')
      .then(response => {
        setBoardgames(response.data);
        console.log(response.data);
      })
      .catch(error => {
        console.error("エラー発生", error);
      });


     // ユーザーが持っているボードゲームを取得する（仮にユーザーIDが必要ならその情報を使用）
    axios.get('http://localhost:8000/match/api/user_may_follow',{
      headers: {
          Authorization: `Bearer ${token}`,
      },
    })  // ユーザーのボードゲーム情報
     .then(response => {
       setUserBoardGames(response.data);
       const usergames = response.data;
       console.log(usergames);
       const initialSwitchStates = usergames.reduce((acc, game) => {
        acc[game.game] = game.want_to_play; // `want_to_play` をスイッチ状態として設定
        return acc;
      }, {});

      setSwitchStates(initialSwitchStates);
        console.log(usergames);



     })
     .catch(error => {
       console.error("ユーザーのボードゲーム情報取得エラー", error);
       //console.log(token);
     });
     
  },[]);
  
  const handleOn = () => {
    console.log('スイッチはオンです');
  };

  // オフの場合に呼ばれる関数
  const handleOff = () => {
    console.log('スイッチはオフです');
  };


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
              <Switch checked={switchStates[boardgame.id] || false}  />
              </div>
              </Card>
          ))}
        </ul>
      )}
    </div>
  );

  
}