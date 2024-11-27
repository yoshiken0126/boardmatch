'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '../../context/AuthContext';

export default function LoginFormJsx() {
  const { login } = useAuth();
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault()
    // ここでログイン処理を行います。実際のアプリケーションでは、
    // この部分でバックエンドAPIを呼び出すなどの処理を行います。
    try {
      const success = await login(username, password);  // login関数を呼び出す

      if (success) {
        // ログイン成功時の処理。例えば、ダッシュボードにリダイレクトなど。
        console.log('Login successful!');       
      } else {
        // ログイン失敗時のエラーハンドリング
        setError('ユーザー名またはパスワードが間違っています。');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('ログイン処理中にエラーが発生しました。');
    }
    console.log('Login attempt', { username, password })
  }

  return (
    (<Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              placeholder="ユーザー名を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required />
          </div>
          <Button type="submit" className="w-full">ログイン</Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        アカウント登録は<a href="#" className="text-primary hover:underline">こちら</a>
      </CardFooter>
    </Card>)
  );
}