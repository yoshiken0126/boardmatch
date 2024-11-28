'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from 'axios';
import { useRouter } from 'next/navigation'; 

export default function SignupForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password || !confirmPassword) {
      setError('すべてのフィールドを入力してください。')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    try {
      // axiosを使ってサインアップのリクエストを送る
      const response = await axios.post('http://localhost:8000/accounts/api/signup/', {
        username,
        password,
      });

      // レスポンスが成功した場合
      if (response.status === 201) {
        console.log('サインアップ成功:', response.data);
        // 成功時の処理（リダイレクトや成功メッセージなど）
        router.push('/login');
      } else {
        // サーバーがエラーレスポンスを返した場合
          console.log('サーバーエラーレスポンス:', response);
        setError('サインアップに失敗しました。再試行してください。');
      }
    } catch (error) {
      // ネットワークエラーやサーバーエラー時の処理
      console.error('サインアップエラー:', error);
      setError('サインアップ中にエラーが発生しました。再試行してください。');
    } finally {
      setLoading(false); // ローディング状態を解除
    }
  
  

    // ここでサインアップのロジックを実装します
    //console.log('サインアップ:', { username, password })
    // 通常はここでAPIを呼び出してユーザーを登録します
  };

  return (
    <div className="flex justify-center items-center mt-20">
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">サインアップ</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザーネーム</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">パスワード（確認）</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500" role="alert">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>サインアップ</Button>
        </CardFooter>
      </form>
    </Card>
    </div>
  )
}