'use client'
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // APIリクエスト用
import { Switch } from "@/components/ui/switch" // Switchコンポーネント

export default function Freetime() {
    const [freetimes, setFreetimes] = useState({});
    const [switchStates, setSwitchStates] = useState({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    });

    const [userFreetimeId, setUserFreetimeId] = useState(null);  // userFreetimeIdを管理

    // freetimesをAPIから取得
    useEffect(() => {
        const fetchFreetimes = async () => {
            try {
                const response = await axios.get('http://localhost:8000/match/api/user_freetimes/', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`, // トークンの取得
                    }
                });
                if (response.data.length > 0) {
                    const data = response.data[0]; // 最初のレスポンスがログインユーザーのデータと仮定
                    setFreetimes(data);
                    setUserFreetimeId(data.id); // 取得したuserFreetimeIdをセット

                    // スイッチの初期状態を設定
                    setSwitchStates({
                        monday: data.monday,
                        tuesday: data.tuesday,
                        wednesday: data.wednesday,
                        thursday: data.thursday,
                        friday: data.friday,
                        saturday: data.saturday,
                        sunday: data.sunday,
                    });
                }
            } catch (error) {
                console.error('Error fetching freetimes:', error);
            }
        };

        fetchFreetimes();
    }, []);

    // スイッチの状態を変更する関数
    const handleSwitchChange = useCallback((day, checked) => {
        if (!userFreetimeId) {
            console.error('User FreeTime ID is not set.');
            return;
        }

        // スイッチ状態をローカルで更新
        setSwitchStates((prevState) => ({
            ...prevState,
            [day]: checked,
        }));

        // サーバー側に変更を送信
        axios.patch(`http://localhost:8000/match/api/user_freetimes/${userFreetimeId}/`, {
            [day]: checked
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        })
        .then(response => {
            console.log('Update successful:', response.data);
        })
        .catch(error => {
            console.error('Error updating freetime:', error);
        });
    }, [userFreetimeId]);  // userFreetimeIdが変更されたときに再実行されるように依存

    return (
        <div>
            {freetimes && (
                <div>
                    {Object.keys(switchStates).map((day) => (
                        <div key={day} className="flex items-center justify-between">
                            <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
    
                            <Switch
                                checked={switchStates[day]}
                                onCheckedChange={(checked) => handleSwitchChange(day, checked)}  // onCheckedChangeを使用
                                className={`${
                                    switchStates[day] ? 'bg-blue-500' : 'bg-gray-200'
                                } relative inline-flex items-center h-6 rounded-full w-11`}
                            >
                                <span
                                    className={`${
                                        switchStates[day] ? 'translate-x-5' : 'translate-x-0'
                                    } inline-block w-4 h-4 transform bg-white rounded-full`}
                                />
                            </Switch>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}