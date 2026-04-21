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

export { getToken };
