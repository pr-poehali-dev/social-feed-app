"""
Профиль: редактирование, загрузка фото (S3), удаление контента.
GET /  — получить свой профиль
POST / action=update — обновить имя, bio
POST / action=upload_avatar — загрузить аватар (base64)
POST / action=upload_banner — загрузить баннер (base64)
POST / action=delete_post — удалить свой пост
POST / action=delete_message — удалить своё сообщение
"""
import json
import os
import base64
import hashlib
import hmac
import datetime
import urllib.request
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def s3_put(key: str, data: bytes, content_type: str):
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    secret_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    bucket = "files"
    host = "bucket.poehali.dev"
    region = "us-east-1"
    service = "s3"

    now = datetime.datetime.utcnow()
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")

    url = f"https://{host}/{bucket}/{key}"

    payload_hash = hashlib.sha256(data).hexdigest()
    canonical_headers = f"content-type:{content_type}\nhost:{host}\nx-amz-content-sha256:{payload_hash}\nx-amz-date:{amz_date}\n"
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canonical_request = f"PUT\n/{bucket}/{key}\n\n{canonical_headers}\n{signed_headers}\n{payload_hash}"

    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = f"AWS4-HMAC-SHA256\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode()).hexdigest()}"

    def sign(key, msg):
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()

    signing_key = sign(sign(sign(sign(("AWS4" + secret_key).encode(), date_stamp), region), service), "aws4_request")
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()

    auth = (f"AWS4-HMAC-SHA256 Credential={access_key}/{credential_scope}, "
            f"SignedHeaders={signed_headers}, Signature={signature}")

    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("Content-Type", content_type)
    req.add_header("x-amz-date", amz_date)
    req.add_header("x-amz-content-sha256", payload_hash)
    req.add_header("Authorization", auth)
    with urllib.request.urlopen(req) as resp:
        return resp.status

def get_user_id_by_token(cur, schema, token):
    if not token:
        return None
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def cdn_url(key):
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    token = ((event.get("headers") or {}).get("X-Auth-Token") or "").strip()
    schema = os.environ["MAIN_DB_SCHEMA"]

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = get_user_id_by_token(cur, schema, token)
        if not user_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

        if method == "GET":
            cur.execute(
                f"SELECT id, name, username, bio, avatar, avatar_url, banner_url, followers_count, following_count, posts_count "
                f"FROM {schema}.users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not_found"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "user": {
                    "id": row[0], "name": row[1], "username": row[2],
                    "bio": row[3] or "", "avatar": row[4] or "",
                    "avatarUrl": row[5] or "", "bannerUrl": row[6] or "",
                    "followers": row[7], "following": row[8], "posts": row[9],
                }
            })}

        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        # Обновить имя и bio
        if action == "update":
            name = (body.get("name") or "").strip()
            bio = (body.get("bio") or "").strip()
            if not name:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Имя не может быть пустым"})}
            if len(name) > 100:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Имя слишком длинное"})}

            def make_initials(n):
                parts = n.strip().split()
                if len(parts) >= 2:
                    return (parts[0][0] + parts[1][0]).upper()
                return n[:2].upper()

            avatar_initials = make_initials(name)
            cur.execute(
                f"UPDATE {schema}.users SET name = %s, bio = %s, avatar = %s WHERE id = %s",
                (name, bio[:300], avatar_initials, user_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "avatar": avatar_initials})}

        # Загрузить аватар
        if action == "upload_avatar":
            data_b64 = body.get("data", "")
            content_type = body.get("contentType", "image/jpeg")
            if not data_b64:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no data"})}

            img_bytes = base64.b64decode(data_b64)
            if len(img_bytes) > 5 * 1024 * 1024:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Файл слишком большой (макс 5MB)"})}

            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
            key = f"avatars/{user_id}.{ext}"
            s3_put(key, img_bytes, content_type)
            import time
            url = cdn_url(key) + f"?t={int(time.time())}"

            cur.execute(f"UPDATE {schema}.users SET avatar_url = %s WHERE id = %s", (url, user_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "url": url})}

        # Загрузить баннер
        if action == "upload_banner":
            data_b64 = body.get("data", "")
            content_type = body.get("contentType", "image/jpeg")
            if not data_b64:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no data"})}

            img_bytes = base64.b64decode(data_b64)
            if len(img_bytes) > 10 * 1024 * 1024:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Файл слишком большой (макс 10MB)"})}

            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
            key = f"banners/{user_id}.{ext}"
            s3_put(key, img_bytes, content_type)
            import time
            url = cdn_url(key) + f"?t={int(time.time())}"

            cur.execute(f"UPDATE {schema}.users SET banner_url = %s WHERE id = %s", (url, user_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "url": url})}

        # Удалить пост
        if action == "delete_post":
            post_id = body.get("postId")
            if not post_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "postId required"})}
            cur.execute(
                f"DELETE FROM {schema}.posts WHERE id = %s AND user_id = %s",
                (int(post_id), user_id)
            )
            if cur.rowcount == 0:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав для удаления"})}
            cur.execute(
                f"UPDATE {schema}.users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = %s",
                (user_id,)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # Удалить сообщение
        if action == "delete_message":
            msg_id = body.get("messageId")
            if not msg_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "messageId required"})}
            cur.execute(
                f"DELETE FROM {schema}.messages WHERE id = %s AND from_user_id = %s",
                (int(msg_id), user_id)
            )
            if cur.rowcount == 0:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown_action"})}

    finally:
        cur.close()
        conn.close()