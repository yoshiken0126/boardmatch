"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, getToken, removeToken } from '@/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    console.log('取得したトークン:', token);
    if (token) {
      try {
        const response = await fetch('http://localhost:8000/accounts/token/verify/', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type':'application/json',
            'Authorization':`Bearer ${token}`,
          },
          body:JSON.stringify({ token }),
        });
        
        console.log('Authorization ヘッダー:', `Bearer ${token}`);
        console.log('Response status:', response.status);  // ステータスコードのログ
        const responseBody = await response.clone().text();  // レスポンスのテキストを取得してログに出力 
        console.log('Response body:', responseBody);  // レスポンスのボディのログ

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          removeToken();
        }
      } catch (error) {
        console.error('認証チェック失敗', error);
        removeToken();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/accounts/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.access);
      await checkAuth();
      router.push('/boardgame');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};