"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Blocks } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function LoginFormJsx() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("") // Clear any previous error

    // ここでログイン処理を行います。実際のアプリケーションでは、
    // この部分でバックエンドAPIを呼び出すなどの処理を行います。
    try {
      const success = await login(username, password) // login関数を呼び出す

      if (success) {
        // ログイン成功時の処理。例えば、ダッシュボードにリダイレクトなど。
        console.log("Login successful!")
      } else {
        // ログイン失敗時のエラーハンドリング
        setError("")
      }
    } catch (err) {
      console.error("Error during login:", err)
      setError("ログイン処理中にエラーが発生しました。")
    }
  }

  return (
    <div className="flex justify-center items-center mt-20">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="pt-6 pb-2">
          <div className="flex justify-center">
            <div className="flex items-center text-2xl font-bold tracking-tight">
              <span className="text-primary">卓</span>
              <span className="text-gray-500 italic">match</span>
              <Blocks className="h-6 w-6 ml-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="ユーザー名を入力"
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
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          アカウント登録は
          <a href="/signup" className="text-primary hover:underline">
            こちら
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}

