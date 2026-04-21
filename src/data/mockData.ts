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

export const currentUser: User = {
  id: "me",
  name: "Алекс Орлов",
  username: "alex_orlov",
  avatar: "АО",
  bio: "Дизайнер · Минимализм · Тишина",
  followers: 1240,
  following: 88,
  posts: 34,
};

export const users: User[] = [
  {
    id: "u1",
    name: "Мария Волкова",
    username: "mari_v",
    avatar: "МВ",
    bio: "Фотограф. Ищу свет в темноте.",
    followers: 3820,
    following: 120,
    posts: 87,
    isFollowing: true,
  },
  {
    id: "u2",
    name: "Даниил Черных",
    username: "d_chernykh",
    avatar: "ДЧ",
    bio: "Разработчик. Кофе. Ночь.",
    followers: 890,
    following: 34,
    posts: 21,
    isFollowing: false,
  },
  {
    id: "u3",
    name: "Соня Лис",
    username: "sonya_lis",
    avatar: "СЛ",
    bio: "Писательница. Слова — мой код.",
    followers: 5100,
    following: 210,
    posts: 156,
    isFollowing: false,
  },
  {
    id: "u4",
    name: "Игорь Нет",
    username: "igor_net",
    avatar: "ИН",
    bio: "Музыкант. Электроника. Абстракция.",
    followers: 2300,
    following: 67,
    posts: 43,
    isFollowing: true,
  },
  {
    id: "u5",
    name: "Вера Тихая",
    username: "vera_t",
    avatar: "ВТ",
    bio: "Архитектор пространств и идей.",
    followers: 1560,
    following: 95,
    posts: 29,
    isFollowing: false,
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    userId: "u1",
    content: "Рассвет в 5:30. Никого нет. Только свет, который не спрашивает разрешения.",
    timestamp: "2 мин назад",
    likes: 47,
    isLiked: false,
    comments: 8,
  },
  {
    id: "p2",
    userId: "u2",
    content: "Написал функцию за 20 минут. Потратил 3 часа на то, чтобы понять, зачем она нужна.",
    timestamp: "14 мин назад",
    likes: 112,
    isLiked: true,
    comments: 23,
  },
  {
    id: "p3",
    userId: "u3",
    content: "Пустая страница — это не страх. Это возможность. Страх приходит, когда начинаешь писать.",
    timestamp: "1 час назад",
    likes: 234,
    isLiked: false,
    comments: 41,
  },
  {
    id: "p4",
    userId: "me",
    content: "Убрал из проекта всё лишнее. Осталось только то, что работает. Стало лучше.",
    timestamp: "3 часа назад",
    likes: 89,
    isLiked: false,
    comments: 12,
  },
  {
    id: "p5",
    userId: "u4",
    content: "Новый трек готов. 4 минуты тишины с редкими ударами. Назвал его «Инфраструктура».",
    timestamp: "5 часов назад",
    likes: 178,
    isLiked: false,
    comments: 35,
  },
  {
    id: "p6",
    userId: "u5",
    content: "Лучшие здания — те, которые не замечаешь, пока не начнёшь чувствовать себя хорошо внутри.",
    timestamp: "вчера",
    likes: 301,
    isLiked: true,
    comments: 56,
  },
];

export const conversations: { userId: string; messages: Message[] }[] = [
  {
    userId: "u1",
    messages: [
      { id: "m1", fromId: "u1", toId: "me", text: "Привет! Видел твои последние работы — очень круто.", timestamp: "10:23", isRead: true },
      { id: "m2", fromId: "me", toId: "u1", text: "Спасибо! Твои фото тоже вдохновляют.", timestamp: "10:45", isRead: true },
      { id: "m3", fromId: "u1", toId: "me", text: "Может, сделаем совместный проект?", timestamp: "11:02", isRead: false },
    ],
  },
  {
    userId: "u2",
    messages: [
      { id: "m4", fromId: "u2", toId: "me", text: "Какой стек используешь?", timestamp: "вчера", isRead: true },
      { id: "m5", fromId: "me", toId: "u2", text: "React + TypeScript. Минимализм во всём.", timestamp: "вчера", isRead: true },
    ],
  },
  {
    userId: "u4",
    messages: [
      { id: "m6", fromId: "u4", toId: "me", text: "Послушай новый трек, скину ссылку.", timestamp: "2 дня назад", isRead: true },
    ],
  },
];
