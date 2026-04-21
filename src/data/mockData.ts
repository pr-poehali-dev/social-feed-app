// Моковые данные — только для структуры типов
// Реальные данные загружаются из API

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  comments: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

// Пустые массивы — все данные из БД
export const users: User[] = [];
export const posts: Post[] = [];
export const conversations: { userId: string; messages: Message[] }[] = [];

export const currentUser: User = {
  id: "me",
  name: "",
  username: "",
  avatar: "",
  bio: "",
  followers: 0,
  following: 0,
  posts: 0,
};
