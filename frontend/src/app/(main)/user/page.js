'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
      console.log(response)

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
    <div className="max-w-4xl mx-auto">
      {userFollows.length === 0 ? (
        <p>フォローしているユーザーはまだいません。</p>
      ) : (
        <ul className="space-y-4">
          {userFollows.map(follow => (
            <Card key={follow.id} className="relative">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center flex-grow">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={follow.to_user.profile_picture || '/placeholder.svg'} alt={follow.to_user.username} />
                    <AvatarFallback>{follow.to_user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col sm:flex-row sm:items-center flex-grow">
                    <h3 className="text-lg font-semibold mr-4">{follow.to_user.username} さん</h3>
                    <div className="flex flex-wrap mt-2 sm:mt-0">
                      {follow.to_user.game_class.map((gameClass, index) => (
                        <span 
                          key={index} 
                          className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 sm:mb-0"
                        >
                          {gameClass}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Switch    
                  checked={switchStates[follow.id] || false}  
                  onCheckedChange={(checked) => handleSwitchChange(follow.id, follow.to_user, checked)}
                />
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}