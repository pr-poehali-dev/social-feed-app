"""
Посты и комментарии: лента, создание, удаление, лайки, комментарии.
GET /                  — лента (все посты)
GET /?userId=X         — посты пользователя
GET /?postId=X&comments=1 — комментарии к посту
POST / action=create         — создать пост
POST / action=delete         — удалить пост
POST / action=like           — лайк/анлайк
POST / action=add_comment    — добавить комментарий
POST / action=delete_comment — удалить комментарий
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

def format_time(dt):
    import datetime
    now = datetime.datetime.utcnow()
    diff = now - dt.replace(tzinfo=None)
    s = diff.total_seconds()
    if s < 60:
        return "только что"
    if s < 3600:
        return f"{int(s // 60)} мин назад"
    if s < 86400:
        return f"{int(s // 3600)} ч назад"
    if s < 86400 * 7:
        return f"{int(s // 86400)} дн назад"
    return dt.strftime("%d.%m.%Y")

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
            filter_user_id = params.get("userId")
            post_id_comments = params.get("postId")

            # Комментарии к посту
            if post_id_comments and params.get("comments"):
                cur.execute(
                    f"""SELECT c.id, c.user_id, c.content, c.created_at,
                        u.name, u.username, u.avatar, u.avatar_url
                        FROM {schema}.comments c
                        JOIN {schema}.users u ON u.id = c.user_id
                        WHERE c.post_id = %s
                        ORDER BY c.created_at ASC""",
                    (int(post_id_comments),)
                )
                rows = cur.fetchall()
                comments = []
                for row in rows:
                    comments.append({
                        "id": str(row[0]),
                        "userId": str(row[1]),
                        "content": row[2],
                        "timestamp": format_time(row[3]),
                        "authorName": row[4],
                        "authorUsername": row[5],
                        "authorAvatar": row[6] or "",
                        "authorAvatarUrl": row[7] or "",
                        "isOwn": row[1] == current_user_id,
                    })
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"comments": comments})}

            if filter_user_id:
                cur.execute(
                    f"""SELECT p.id, p.user_id, p.content, p.likes_count, p.comments_count, p.created_at,
                        u.name, u.username, u.avatar, u.avatar_url,
                        EXISTS(SELECT 1 FROM {schema}.likes l WHERE l.post_id = p.id AND l.user_id = %s) as is_liked
                        FROM {schema}.posts p
                        JOIN {schema}.users u ON u.id = p.user_id
                        WHERE p.user_id = %s
                        ORDER BY p.created_at DESC LIMIT 50""",
                    (current_user_id or 0, int(filter_user_id))
                )
            else:
                cur.execute(
                    f"""SELECT p.id, p.user_id, p.content, p.likes_count, p.comments_count, p.created_at,
                        u.name, u.username, u.avatar, u.avatar_url,
                        EXISTS(SELECT 1 FROM {schema}.likes l WHERE l.post_id = p.id AND l.user_id = %s) as is_liked
                        FROM {schema}.posts p
                        JOIN {schema}.users u ON u.id = p.user_id
                        ORDER BY p.created_at DESC LIMIT 100""",
                    (current_user_id or 0,)
                )

            rows = cur.fetchall()
            posts = []
            for row in rows:
                posts.append({
                    "id": str(row[0]),
                    "userId": str(row[1]),
                    "content": row[2],
                    "likes": row[3],
                    "comments": row[4],
                    "timestamp": format_time(row[5]),
                    "authorName": row[6],
                    "authorUsername": row[7],
                    "authorAvatar": row[8] or "",
                    "authorAvatarUrl": row[9] or "",
                    "isLiked": bool(row[10]),
                })

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"posts": posts})}

        if method == "POST":
            if not current_user_id:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

            body = json.loads(event.get("body") or "{}")
            action = body.get("action", "")

            if action == "create":
                content = (body.get("content") or "").strip()
                if not content:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пост не может быть пустым"})}
                if len(content) > 2000:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пост слишком длинный"})}

                cur.execute(
                    f"INSERT INTO {schema}.posts (user_id, content) VALUES (%s, %s) RETURNING id, created_at",
                    (current_user_id, content)
                )
                post_id, created_at = cur.fetchone()
                cur.execute(
                    f"UPDATE {schema}.users SET posts_count = posts_count + 1 WHERE id = %s",
                    (current_user_id,)
                )
                cur.execute(
                    f"SELECT name, username, avatar, avatar_url FROM {schema}.users WHERE id = %s",
                    (current_user_id,)
                )
                u = cur.fetchone()
                conn.commit()

                return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                    "post": {
                        "id": str(post_id),
                        "userId": str(current_user_id),
                        "content": content,
                        "likes": 0,
                        "comments": 0,
                        "timestamp": "только что",
                        "authorName": u[0],
                        "authorUsername": u[1],
                        "authorAvatar": u[2] or "",
                        "authorAvatarUrl": u[3] or "",
                        "isLiked": False,
                    }
                })}

            if action == "delete":
                post_id = body.get("postId")
                if not post_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "postId required"})}
                cur.execute(
                    f"DELETE FROM {schema}.posts WHERE id = %s AND user_id = %s",
                    (int(post_id), current_user_id)
                )
                if cur.rowcount == 0:
                    return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав"})}
                cur.execute(
                    f"UPDATE {schema}.users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = %s",
                    (current_user_id,)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            if action == "like":
                post_id = body.get("postId")
                if not post_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "postId required"})}
                post_id = int(post_id)

                cur.execute(
                    f"SELECT 1 FROM {schema}.likes WHERE user_id = %s AND post_id = %s",
                    (current_user_id, post_id)
                )
                already_liked = cur.fetchone() is not None

                if already_liked:
                    cur.execute(
                        f"DELETE FROM {schema}.likes WHERE user_id = %s AND post_id = %s",
                        (current_user_id, post_id)
                    )
                    cur.execute(
                        f"UPDATE {schema}.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = %s",
                        (post_id,)
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {schema}.likes (user_id, post_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (current_user_id, post_id)
                    )
                    cur.execute(
                        f"UPDATE {schema}.posts SET likes_count = likes_count + 1 WHERE id = %s",
                        (post_id,)
                    )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"liked": not already_liked})}

            if action == "add_comment":
                post_id = body.get("postId")
                content = (body.get("content") or "").strip()
                if not post_id or not content:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "postId и content обязательны"})}
                if len(content) > 1000:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Комментарий слишком длинный"})}

                cur.execute(
                    f"INSERT INTO {schema}.comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (int(post_id), current_user_id, content)
                )
                comment_id, _ = cur.fetchone()
                cur.execute(
                    f"UPDATE {schema}.posts SET comments_count = comments_count + 1 WHERE id = %s",
                    (int(post_id),)
                )
                cur.execute(
                    f"SELECT name, username, avatar, avatar_url FROM {schema}.users WHERE id = %s",
                    (current_user_id,)
                )
                u = cur.fetchone()
                conn.commit()

                return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                    "comment": {
                        "id": str(comment_id),
                        "userId": str(current_user_id),
                        "content": content,
                        "timestamp": "только что",
                        "authorName": u[0],
                        "authorUsername": u[1],
                        "authorAvatar": u[2] or "",
                        "authorAvatarUrl": u[3] or "",
                        "isOwn": True,
                    }
                })}

            if action == "delete_comment":
                comment_id = body.get("commentId")
                if not comment_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "commentId required"})}

                cur.execute(
                    f"SELECT post_id FROM {schema}.comments WHERE id = %s AND user_id = %s",
                    (int(comment_id), current_user_id)
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав"})}

                cur.execute(f"DELETE FROM {schema}.comments WHERE id = %s", (int(comment_id),))
                cur.execute(
                    f"UPDATE {schema}.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = %s",
                    (row[0],)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    finally:
        cur.close()
        conn.close()