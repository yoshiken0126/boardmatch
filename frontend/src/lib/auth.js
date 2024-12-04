"use client";

export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    console.log('トークンを保存しました:', token);
    localStorage.setItem('token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('現在のトークン:', token);
    if (token) {
      console.log('トークンを取得しました');
      return token;
    } else {
      console.log('トークンはありませんでした');
      return null;
    }
  }
  console.log('windowが未定義です。サーバーサイドレンダリングの可能性があります');
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    console.log('トークンを削除しました');
  }
};