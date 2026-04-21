"""
Личные сообщения между пользователями.
GET / — список диалогов текущего пользователя
GET /?userId=X — сообщения с конкретным пользователем
POST / body.action=send — отправить сообщение
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
        if not current_user_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

        if method == "GET":
            params = event.get("queryStringParameters") or {}
            other_id = params.get("userId")

            if other_id:
                # Сообщения с конкретным пользователем
                other_id = int(other_id)
                cur.execute(
                    f"SELECT m.id, m.from_user_id, m.to_user_id, m.text, m.is_read, "
                    f"to_char(m.created_at, 'HH24:MI') as time "
                    f"FROM {schema}.messages m "
                    f"WHERE (m.from_user_id = %s AND m.to_user_id = %s) "
                    f"   OR (m.from_user_id = %s AND m.to_user_id = %s) "
                    f"ORDER BY m.created_at ASC",
                    (current_user_id, other_id, other_id, current_user_id)
                )
                rows = cur.fetchall()

                # Получаем данные собеседника
                cur.execute(
                    f"SELECT id, name, username, avatar FROM {schema}.users WHERE id = %s",
                    (other_id,)
                )
                u = cur.fetchone()
                other_user = {"id": str(u[0]), "name": u[1], "username": u[2], "avatar": u[3]} if u else None

                messages = []
                for row in rows:
                    messages.append({
                        "id": str(row[0]),
                        "fromId": str(row[1]),
                        "toId": str(row[2]),
                        "text": row[3],
                        "isRead": row[4],
                        "timestamp": row[5],
                    })

                return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                    "messages": messages,
                    "otherUser": other_user,
                })}

            else:
                # Список диалогов: последнее сообщение с каждым собеседником
                cur.execute(
                    f"""
                    SELECT DISTINCT ON (other_id)
                        other_id,
                        u.name, u.username, u.avatar,
                        m.text, m.from_user_id,
                        to_char(m.created_at, 'HH24:MI') as time,
                        m.created_at,
                        COUNT(CASE WHEN m2.is_read = false AND m2.from_user_id != %s THEN 1 END)
                            OVER (PARTITION BY other_id) as unread
                    FROM (
                        SELECT
                            CASE WHEN from_user_id = %s THEN to_user_id ELSE from_user_id END as other_id,
                            id, text, from_user_id, created_at, is_read
                        FROM {schema}.messages
                        WHERE from_user_id = %s OR to_user_id = %s
                    ) m
                    JOIN {schema}.users u ON u.id = m.other_id
                    LEFT JOIN {schema}.messages m2 ON
                        ((m2.from_user_id = m.other_id AND m2.to_user_id = %s)
                        OR (m2.from_user_id = %s AND m2.to_user_id = m.other_id))
                    ORDER BY other_id, m.created_at DESC
                    """,
                    (current_user_id, current_user_id, current_user_id, current_user_id, current_user_id, current_user_id)
                )
                rows = cur.fetchall()

                # Получаем диалоги
                cur.execute(
                    f"""
                    SELECT
                        sub.other_id,
                        u.name, u.username, u.avatar,
                        sub.last_text, sub.last_from, sub.last_time,
                        (SELECT COUNT(*) FROM {schema}.messages m3
                         WHERE m3.from_user_id = sub.other_id AND m3.to_user_id = %s AND m3.is_read = false) as unread
                    FROM (
                        SELECT DISTINCT ON (other_id)
                            CASE WHEN from_user_id = %s THEN to_user_id ELSE from_user_id END as other_id,
                            text as last_text,
                            from_user_id as last_from,
                            to_char(created_at, 'HH24:MI') as last_time,
                            created_at as msg_created_at
                        FROM {schema}.messages
                        WHERE from_user_id = %s OR to_user_id = %s
                        ORDER BY other_id, created_at DESC
                    ) sub
                    JOIN {schema}.users u ON u.id = sub.other_id
                    ORDER BY sub.msg_created_at DESC
                    """,
                    (current_user_id, current_user_id, current_user_id, current_user_id)
                )
                rows = cur.fetchall()

                convs = []
                for row in rows:
                    convs.append({
                        "userId": str(row[0]),
                        "name": row[1],
                        "username": row[2],
                        "avatar": row[3],
                        "lastText": row[4],
                        "lastFromMe": str(row[5]) == str(current_user_id),
                        "lastTime": row[6],
                        "unread": int(row[7]),
                    })

                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"conversations": convs})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action", "")

            if action == "send":
                to_id = body.get("toId")
                text = (body.get("text") or "").strip()

                if not to_id or not text:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "toId and text required"})}

                cur.execute(
                    f"INSERT INTO {schema}.messages (from_user_id, to_user_id, text) VALUES (%s, %s, %s) RETURNING id, to_char(created_at, 'HH24:MI')",
                    (current_user_id, int(to_id), text)
                )
                row = cur.fetchone()
                conn.commit()

                return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                    "message": {
                        "id": str(row[0]),
                        "fromId": str(current_user_id),
                        "toId": str(to_id),
                        "text": text,
                        "isRead": False,
                        "timestamp": row[1],
                    }
                })}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    finally:
        cur.close()
        conn.close()