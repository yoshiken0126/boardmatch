'use client';
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle,CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'

export default function SimpleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>シンプルなカード</CardTitle>
        <CardDescription>これはシンプルなカードの例です。</CardDescription>
      </CardHeader>
      <CardContent>
        カードのコンテンツエリアです。
      </CardContent>
      <Switch> </Switch>
    </Card>
  );
}