'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle,CardDescription,CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Navbar from '@/components/navbar'
import { useAuth } from '../../context/AuthContext';
import { getToken } from '@/lib/auth';

export default function Home() {
  const[boardgames,setBoardgames] = useState([]);
  const [userBoardGames, setUserBoardGames] = useState([]);
  const token = getToken();
  const [switchStates, setSwitchStates] = useState({});
  
  useEffect(() => {
   
    axios.get('http://localhost:8000/match/api/boardgame_list/')
      .then(response => {
        setBoardgames(response.data);
        console.log(response.data);
      })
      .catch(error => {
        console.error("エラー発生", error);
      });


     // ユーザーが持っているボードゲームを取得する（仮にユーザーIDが必要ならその情報を使用）
     axios.get('http://localhost:8000/match/api/user_game_relations/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      setUserBoardGames(response.data);
      const usergames = response.data;
      console.log(usergames);

      // ユーザーのボードゲーム情報を元にスイッチ状態を初期化
      const initialSwitchStates = usergames.reduce((acc, game) => {
        acc[game.game] = game.want_to_play; // `want_to_play` をスイッチ状態として設定
        return acc;
      }, {});

      setSwitchStates(initialSwitchStates);
      console.log(usergames);
    })
    .catch(error => {
      console.error("ユーザーのボードゲーム情報取得エラー", error);
    });
     
  },[]);

   // スイッチの状態が変更されたときに呼ばれる関数
   const handleSwitchChange = async (gameId, checked) => {
    try {
      if (checked) {
        // スイッチがオンになった場合：データを作成
        const response = await axios.post(
          'http://localhost:8000/match/api/user_game_relations/',
          { game: gameId, want_to_play: true },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('データが作成されました:', response.data);
      } else {
        
        const relationsResponse = await axios.get(
          `http://localhost:8000/match/api/user_game_relations/?game_id=${gameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log(`ゲームID: ${gameId} に関連するリレーションデータ:`, relationsResponse.data);
  
        // ユーザーゲームリレーションが見つかった場合
        if (relationsResponse.data.length > 0) {
          // 関連するリレーションのIDを取得
          const relationToDelete = relationsResponse.data.find(relation => relation.game === gameId);
  
          if (relationToDelete) {
            console.log(`削除対象のリレーションID: ${relationToDelete.id}`);
            
            // 削除リクエスト
            const deleteResponse = await axios.delete(
              `http://localhost:8000/match/api/user_game_relations/${relationToDelete.id}/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            // 削除後のレスポンスを確認
            console.log('データが削除されました:', deleteResponse.data);
          } else {
            console.log('関連するユーザーゲームリレーションが見つかりません');
          }
        } else {
          console.log('ゲームIDに関連するリレーションが存在しません');
        }
      }
      // スイッチの状態を更新
      setSwitchStates(prev => ({
        ...prev,
        [gameId]: checked,
      }));
    } catch (error) {
      console.error('エラーが発生しました:', error);
      // エラーが発生した場合は、スイッチを元の状態に戻す
      setSwitchStates(prev => ({
        ...prev,
        [gameId]: !checked,
      }));
    }
  };

  const handleOn = () => {
    console.log('スイッチはオンです');
  };

  // オフの場合に呼ばれる関数
  const handleOff = () => {
    console.log('スイッチはオフです');
  };


  return(
    <div>
     
      {boardgames.length === 0 ?(
        <p>ボードゲームは登録されていません</p>
      ) : (
        <ul>
          {boardgames.map(boardgame => (
            <Card key={boardgame.id} className="relative">
              <CardHeader className='text-2xl font-bold rounded'>{boardgame.name}</CardHeader>
              <CardContent>こちらに詳細情報が記載されます。</CardContent>
              <div className="absolute top-4 right-4">
              <Switch    
              checked={switchStates[boardgame.id] || false}  
              onCheckedChange={(checked) => handleSwitchChange(boardgame.id, checked)}
              />
              </div>
              </Card>
          ))}
        </ul>
      )}
    </div>
  );

  
}