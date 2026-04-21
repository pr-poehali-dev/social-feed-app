import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
}

function getToken(): string {
  return localStorage.getItem("void_token") || "";
}

function saveToken(token: string) {
  localStorage.setItem("void_token", token);
}

function clearToken() {
  localStorage.removeItem("void_token");
}

export async function authRegister(name: string, username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", name, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  saveToken(data.token);
  return data;
}

export async function authLogin(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  saveToken(data.token);
  return data;
}

export async function authMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(AUTH_URL, {
    method: "GET",
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) {
    clearToken();
    return null;
  }
  const data = await res.json();
  return data.user;
}

export async function authLogout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ action: "logout" }),
    });
  }
  clearToken();
}

const USERS_URL = func2url.users;
const MESSAGES_URL = func2url.messages;

export interface DiscoverUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  isFollowing: boolean;
}

export async function fetchUsers(q?: string): Promise<DiscoverUser[]> {
  const token = getToken();
  const url = q ? `${USERS_URL}?q=${encodeURIComponent(q)}` : USERS_URL;
  const res = await fetch(url, {
    headers: token ? { "X-Auth-Token": token } : {},
  });
  const data = await res.json();
  return data.users || [];
}

export async function followUser(userId: string): Promise<void> {
  const token = getToken();
  await fetch(USERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "follow", userId }),
  });
}

export async function unfollowUser(userId: string): Promise<void> {
  const token = getToken();
  await fetch(USERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "unfollow", userId }),
  });
}

export interface Conversation {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  lastText: string;
  lastFromMe: boolean;
  lastTime: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  isRead: boolean;
  timestamp: string;
}

export interface OtherUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const token = getToken();
  const res = await fetch(MESSAGES_URL, {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations || [];
}

export async function fetchMessages(userId: string): Promise<{ messages: ChatMessage[]; otherUser: OtherUser | null }> {
  const token = getToken();
  const res = await fetch(`${MESSAGES_URL}?userId=${userId}`, {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) return { messages: [], otherUser: null };
  return res.json();
}

export async function sendMessage(toId: string, text: string): Promise<ChatMessage | null> {
  const token = getToken();
  const res = await fetch(MESSAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "send", toId, text }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.message || null;
}

const PROFILE_URL = func2url.profile;

export interface FullProfile {
  id: number;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  avatarUrl: string;
  bannerUrl: string;
  followers: number;
  following: number;
  posts: number;
}

export async function fetchMyProfile(): Promise<FullProfile | null> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, { headers: { "X-Auth-Token": token } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function updateProfile(name: string, bio: string): Promise<{ ok: boolean; avatar?: string; error?: string }> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "update", name, bio }),
  });
  return res.json();
}

export async function uploadAvatar(base64: string, contentType: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "upload_avatar", data: base64, contentType }),
  });
  return res.json();
}

export async function uploadBanner(base64: string, contentType: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "upload_banner", data: base64, contentType }),
  });
  return res.json();
}

export async function deletePost(postId: string): Promise<boolean> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "delete_post", postId }),
  });
  return res.ok;
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  const token = getToken();
  const res = await fetch(PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify({ action: "delete_message", messageId }),
  });
  return res.ok;
}

export { getToken };