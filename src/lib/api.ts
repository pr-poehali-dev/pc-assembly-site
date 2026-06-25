import func2url from '../../backend/func2url.json';

const API = (func2url as Record<string, string>).api;

export interface User {
  uid: number;
  name: string;
  email: string;
  registeredAt: string;
}

export interface Post {
  id: number;
  author: string;
  title: string;
  description: string;
  price: string;
  link: string;
  image: string;
}

export interface Review {
  id: number;
  author: string;
  text: string;
  rating: number;
}

const TOKEN_KEY = 'novapc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(action: string, method: string, body?: unknown) {
  const res = await fetch(`${API}?action=${action}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    req('register', 'POST', { name, email, password }),
  login: (email: string, password: string) =>
    req('login', 'POST', { email, password }),
  me: () => req('me', 'GET'),
  updateProfile: (name: string, email: string) =>
    req('profile', 'PUT', { name, email }),
  getPosts: () => req('posts', 'GET'),
  addPost: (p: Omit<Post, 'id' | 'author'>) => req('post', 'POST', p),
  getReviews: () => req('reviews', 'GET'),
  addReview: (text: string, rating: number) =>
    req('review', 'POST', { text, rating }),
};
