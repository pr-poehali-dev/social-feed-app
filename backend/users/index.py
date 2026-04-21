"""
Получение списка пользователей (для поиска) и подписки/отписки.
GET / — список всех пользователей (кроме текущего)
GET /?q=... — поиск по имени/логину
POST / body.action=follow — подписаться на пользователя
POST / body.action=unfollow — отписаться
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_id_by_token(cur, schema, token):
    if not token:
        return None
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    token = ((event.get("headers") or {}).get("X-Auth-Token") or "").strip()
    schema = os.environ["MAIN_DB_SCHEMA"]

    conn = get_conn()
    cur = conn.cursor()

    try:
        current_user_id = get_user_id_by_token(cur, schema, token)

        if method == "GET":
            params = event.get("queryStringParameters") or {}
            q = (params.get("q") or "").strip().lower()

            if q:
                cur.execute(
                    f"SELECT id, name, username, bio, avatar, followers_count, following_count "
                    f"FROM {schema}.users "
                    f"WHERE (LOWER(name) LIKE %s OR LOWER(username) LIKE %s) "
                    f"AND id != %s "
                    f"ORDER BY followers_count DESC LIMIT 50",
                    (f"%{q}%", f"%{q}%", current_user_id or 0)
                )
            else:
                cur.execute(
                    f"SELECT id, name, username, bio, avatar, followers_count, following_count "
                    f"FROM {schema}.users "
                    f"WHERE id != %s "
                    f"ORDER BY followers_count DESC, created_at DESC LIMIT 100",
                    (current_user_id or 0,)
                )

            rows = cur.fetchall()

            following_ids = set()
            if current_user_id:
                cur.execute(
                    f"SELECT following_id FROM {schema}.follows WHERE follower_id = %s",
                    (current_user_id,)
                )
                following_ids = {r[0] for r in cur.fetchall()}

            users = []
            for row in rows:
                users.append({
                    "id": str(row[0]),
                    "name": row[1],
                    "username": row[2],
                    "bio": row[3] or "",
                    "avatar": row[4] or "",
                    "followers": row[5],
                    "following": row[6],
                    "isFollowing": row[0] in following_ids,
                })

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

        if method == "POST":
            if not current_user_id:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

            body = json.loads(event.get("body") or "{}")
            action = body.get("action", "")
            target_id = body.get("userId")

            if not target_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "userId required"})}

            target_id = int(target_id)

            if action == "follow":
                cur.execute(
                    f"INSERT INTO {schema}.follows (follower_id, following_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (current_user_id, target_id)
                )
                cur.execute(
                    f"UPDATE {schema}.users SET followers_count = followers_count + 1 WHERE id = %s",
                    (target_id,)
                )
                cur.execute(
                    f"UPDATE {schema}.users SET following_count = following_count + 1 WHERE id = %s",
                    (current_user_id,)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            if action == "unfollow":
                cur.execute(
                    f"DELETE FROM {schema}.follows WHERE follower_id = %s AND following_id = %s",
                    (current_user_id, target_id)
                )
                cur.execute(
                    f"UPDATE {schema}.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = %s",
                    (target_id,)
                )
                cur.execute(
                    f"UPDATE {schema}.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = %s",
                    (current_user_id,)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown_action"})}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    finally:
        cur.close()
        conn.close()
