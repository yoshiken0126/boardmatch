'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getToken } from '@/lib/auth';

export default function Home() {
  const [userFollows, setUserFollows] = useState([]); 
  const token = getToken(); 
  const [switchStates, setSwitchStates] = useState({}); 

  useEffect(() => {
    axios.get('http://localhost:8000/match/api/user_relations/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      const followRelations = response.data;
      setUserFollows(followRelations);

      const initialSwitchStates = followRelations.reduce((acc, follow) => {
        acc[follow.id] = follow.may_follow; 
        return acc;
      }, {});
      setSwitchStates(initialSwitchStates);
    })
    .catch(error => {
      console.error("ユーザーのフォロー関係の取得中にエラーが発生しました:", error);
    });
  }, [token]);

  const handleSwitchChange = async (relationId, toUserId, checked) => {
    try {
      const existingRelation = userFollows.find(relation => relation.id === relationId);

      if (existingRelation) {
        const response = await axios.patch(
          `http://localhost:8000/match/api/user_relations/${relationId}/`,
          { may_follow: checked },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserFollows(prevUserFollows =>
          prevUserFollows.map(relation =>
            relation.id === relationId ? { ...relation, may_follow: checked } : relation
          )
        );

        setSwitchStates(prev => ({
          ...prev,
          [relationId]: checked,
        }));
      }
    } catch (error) {
      console.error('フォロー関係の更新中にエラーが発生しました:', error);
      setSwitchStates(prev => ({
        ...prev,
        [relationId]: !checked,
      }));
    }
  };

  return (
    <div>
      {userFollows.length === 0 ? (
        <p>フォローしているユーザーはまだいません。</p>
      ) : (
        <ul>
          {userFollows.map(follow => (
            <Card key={follow.id} className="relative mb-4">
              <CardHeader className='text-2xl font-bold rounded'>
                {follow.to_user.username} さん
              </CardHeader>
              <CardContent>
                <p>{follow.to_user_description || "このユーザーの詳細情報はありません。"}</p>
                <div className="absolute top-4 right-4">
                  <Switch    
                    checked={switchStates[follow.id] || false}  
                    onCheckedChange={(checked) => handleSwitchChange(follow.id, follow.to_user, checked)}
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