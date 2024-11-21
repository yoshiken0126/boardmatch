"use client";

export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    console.log('トークンを保存しました:', token);
    localStorage.setItem('token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    console.log('トークンを取得しました');
    return localStorage.getItem('token');
    
  }
  console.log('トークンはありませんでした');
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    console.log('トークンを削除しました');
  }
};