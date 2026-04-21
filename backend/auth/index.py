"""
Авторизация: регистрация, вход, выход, получение текущего пользователя.
POST /register — создать аккаунт
POST /login — войти
POST /logout — выйти
GET / — получить текущего пользователя по токену
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    token = event.get("headers", {}).get("X-Auth-Token", "")

    conn = get_conn()
    cur = conn.cursor()
    schema = os.environ["MAIN_DB_SCHEMA"]

    try:
        # GET / — получить текущего пользователя
        if method == "GET":
            if not token:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no_token"})}
            cur.execute(
                f"SELECT u.id, u.name, u.username, u.bio, u.avatar, u.followers_count, u.following_count, u.posts_count "
                f"FROM {schema}.sessions s JOIN {schema}.users u ON u.id = s.user_id "
                f"WHERE s.token = %s AND s.expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_token"})}
            user = {
                "id": row[0], "name": row[1], "username": row[2],
                "bio": row[3], "avatar": row[4],
                "followers": row[5], "following": row[6], "posts": row[7]
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

        body = json.loads(event.get("body") or "{}")

        # POST /register
        if "/register" in path:
            name = (body.get("name") or "").strip()
            username = (body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            if not name or not username or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
            if len(username) < 3:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Логин минимум 3 символа"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            cur.execute(f"SELECT id FROM {schema}.users WHERE username = %s", (username,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Этот логин уже занят"})}

            avatar = make_initials(name)
            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {schema}.users (name, username, bio, avatar, password_hash) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (name, username, "", avatar, pw_hash)
            )
            user_id = cur.fetchone()[0]

            token_new = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {schema}.sessions (user_id, token) VALUES (%s, %s)",
                (user_id, token_new)
            )
            conn.commit()

            user = {
                "id": user_id, "name": name, "username": username,
                "bio": "", "avatar": avatar,
                "followers": 0, "following": 0, "posts": 0
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token_new, "user": user})}

        # POST /login
        if "/login" in path:
            username = (body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            if not username or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}

            pw_hash = hash_password(password)
            cur.execute(
                f"SELECT id, name, username, bio, avatar, followers_count, following_count, posts_count "
                f"FROM {schema}.users WHERE username = %s AND password_hash = %s",
                (username, pw_hash)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}

            token_new = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {schema}.sessions (user_id, token) VALUES (%s, %s)",
                (row[0], token_new)
            )
            conn.commit()

            user = {
                "id": row[0], "name": row[1], "username": row[2],
                "bio": row[3], "avatar": row[4],
                "followers": row[5], "following": row[6], "posts": row[7]
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token_new, "user": user})}

        # POST /logout
        if "/logout" in path:
            if token:
                cur.execute(f"DELETE FROM {schema}.sessions WHERE token = %s", (token,))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not_found"})}

    finally:
        cur.close()
        conn.close()
