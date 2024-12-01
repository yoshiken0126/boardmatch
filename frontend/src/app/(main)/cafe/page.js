'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getToken } from '@/lib/auth';

export default function Home() {
  // 状態の定義
  const [cafes, setCafes] = useState([]); // すべてのカフェのリスト
  const [userCafes, setUserCafes] = useState([]); // ユーザーが関連付けられているカフェのリスト
  const token = getToken(); // 認証トークンの取得
  const [switchStates, setSwitchStates] = useState({}); // 各カフェのスイッチ状態

  useEffect(() => {
    // カフェリストの取得
    axios.get('http://localhost:8000/match/api/cafe_list/')
      .then(response => {
        setCafes(response.data);
      })
      .catch(error => {
        console.error("カフェリストの取得中にエラーが発生しました:", error);
      });

    // ユーザーのカフェ関係の取得
    axios.get('http://localhost:8000/match/api/user_cafe_relations/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      setUserCafes(response.data);
      // スイッチの初期状態を設定
      const initialSwitchStates = response.data.reduce((acc, cafe) => {
        acc[cafe.cafe] = cafe.can_visit;
        return acc;
      }, {});
      setSwitchStates(initialSwitchStates);
    })
    .catch(error => {
      console.error("ユーザーのカフェ関係の取得中にエラーが発生しました:", error);
    });
  }, []);

  // スイッチの状態が変更されたときの処理
  const handleSwitchChange = async (cafeId, checked) => {
    try {
      // このカフェに対する既存の関係を探す
      const existingRelation = userCafes.find(relation => relation.cafe === cafeId);

      if (existingRelation) {
        // 既存の関係を更新
        const response = await axios.patch(
          `http://localhost:8000/match/api/user_cafe_relations/${existingRelation.id}/`,
          { can_visit: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('関係が更新されました:', response.data);

        // userCafes状態を更新
        setUserCafes(prevUserCafes => 
          prevUserCafes.map(relation => 
            relation.id === existingRelation.id ? { ...relation, can_visit: checked } : relation
          )
        );
      } else {
        // 関係が存在しない場合、新しい関係を作成
        const response = await axios.post(
          'http://localhost:8000/match/api/user_cafe_relations/',
          { cafe: cafeId, can_visit: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('新しい関係が作成されました:', response.data);

        // 新しい関係をuserCafes状態に追加
        setUserCafes(prevUserCafes => [...prevUserCafes, response.data]);
      }

      // スイッチの状態を更新
      setSwitchStates(prev => ({
        ...prev,
        [cafeId]: checked,
      }));
    } catch (error) {
      console.error('関係の更新中にエラーが発生しました:', error);
      // エラー時にスイッチの状態を元に戻す
      setSwitchStates(prev => ({
        ...prev,
        [cafeId]: !checked,
      }));
    }
  };

  return (
    <div>
      {cafes.length === 0 ? (
        <p>登録されているカフェはありません</p>
      ) : (
        <ul>
          {cafes.map(cafe => (
            <Card key={cafe.id} className="relative mb-4">
              <CardHeader className='text-2xl font-bold rounded'>{cafe.name}</CardHeader>
              <CardContent>
                <p>{cafe.description || "このカフェの詳細情報はありません。"}</p>
                <div className="absolute top-4 right-4">
                  <Switch    
                    checked={switchStates[cafe.id] || false}  
                    onCheckedChange={(checked) => handleSwitchChange(cafe.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}