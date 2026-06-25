import json
import os
import hashlib
import secrets
import base64
import uuid
from datetime import datetime, timedelta

import boto3
import psycopg2
import psycopg2.extras


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash(password: str) -> str:
    return hashlib.sha256(('novapc_salt_' + password).encode()).hexdigest()


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }


def _resp(status: int, body: dict):
    return {
        'statusCode': status,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, default=str),
    }


def _user_by_token(cur, token: str):
    if not token:
        return None
    cur.execute("SELECT * FROM users WHERE token = %s", (token,))
    return cur.fetchone()


def _user_dto(row) -> dict:
    return {
        'uid': row['id'],
        'name': row['name'],
        'email': row['email'] or '',
        'registeredAt': row['created_at'].strftime('%d.%m.%Y') if row['created_at'] else '',
    }


def _upload_image(data_url: str) -> str:
    '''Принимает base64 data URL, грузит в S3, возвращает CDN-ссылку'''
    header, _, b64 = data_url.partition(',')
    ext = 'png'
    if 'jpeg' in header or 'jpg' in header:
        ext = 'jpg'
    elif 'webp' in header:
        ext = 'webp'
    raw = base64.b64decode(b64)
    key = f"posts/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=f'image/{ext}')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    '''API сайта сборки ПК: вход по имени/почте, посты с удалением и загрузкой фото, отзывы, сброс пароля'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    conn = _conn()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if method == 'GET' and action == 'posts':
            cur.execute("SELECT * FROM posts ORDER BY created_at DESC")
            return _resp(200, {'posts': [dict(r) for r in cur.fetchall()]})

        if method == 'GET' and action == 'reviews':
            cur.execute("SELECT * FROM reviews ORDER BY created_at DESC")
            return _resp(200, {'reviews': [dict(r) for r in cur.fetchall()]})

        if method == 'GET' and action == 'me':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            return _resp(200, {'user': _user_dto(u)})

        if method == 'POST' and action == 'register':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not name or not password:
                return _resp(400, {'error': 'Заполните имя и пароль'})
            cur.execute("SELECT id FROM users WHERE LOWER(name) = LOWER(%s)", (name,))
            if cur.fetchone():
                return _resp(409, {'error': 'Это имя уже занято'})
            if email:
                cur.execute("SELECT id FROM users WHERE LOWER(email) = %s AND email <> ''", (email,))
                if cur.fetchone():
                    return _resp(409, {'error': 'Почта уже зарегистрирована'})
            new_token = secrets.token_hex(24)
            cur.execute(
                "INSERT INTO users (name, email, password_hash, token) VALUES (%s, %s, %s, %s) RETURNING *",
                (name, email, _hash(password), new_token),
            )
            return _resp(200, {'token': new_token, 'user': _user_dto(cur.fetchone())})

        if method == 'POST' and action == 'login':
            login = (body.get('login') or body.get('email') or '').strip()
            password = body.get('password') or ''
            if not login or not password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute(
                "SELECT * FROM users WHERE LOWER(name) = LOWER(%s) "
                "OR (email <> '' AND LOWER(email) = LOWER(%s))",
                (login, login),
            )
            u = cur.fetchone()
            if not u or u['password_hash'] != _hash(password):
                return _resp(401, {'error': 'Неверный логин или пароль'})
            new_token = secrets.token_hex(24)
            cur.execute("UPDATE users SET token = %s WHERE id = %s", (new_token, u['id']))
            return _resp(200, {'token': new_token, 'user': _user_dto(u)})

        if method == 'POST' and action == 'reset-request':
            email = (body.get('email') or '').strip().lower()
            if not email:
                return _resp(400, {'error': 'Укажите почту'})
            cur.execute("SELECT * FROM users WHERE email <> '' AND LOWER(email) = %s", (email,))
            u = cur.fetchone()
            if not u:
                return _resp(404, {'error': 'Аккаунт с такой почтой не найден'})
            code = ''.join(secrets.choice('0123456789') for _ in range(6))
            expires = datetime.utcnow() + timedelta(minutes=15)
            cur.execute(
                "INSERT INTO password_resets (user_id, code, expires_at) VALUES (%s, %s, %s)",
                (u['id'], code, expires),
            )
            # SMTP пока не настроен — возвращаем код на экран
            return _resp(200, {'message': 'Код для сброса пароля', 'code': code})

        if method == 'POST' and action == 'reset-confirm':
            email = (body.get('email') or '').strip().lower()
            code = (body.get('code') or '').strip()
            new_password = body.get('new_password') or ''
            if not email or not code or not new_password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute("SELECT * FROM users WHERE email <> '' AND LOWER(email) = %s", (email,))
            u = cur.fetchone()
            if not u:
                return _resp(404, {'error': 'Аккаунт не найден'})
            cur.execute(
                "SELECT * FROM password_resets WHERE user_id = %s AND code = %s "
                "AND used = FALSE AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1",
                (u['id'], code),
            )
            pr = cur.fetchone()
            if not pr:
                return _resp(400, {'error': 'Неверный или истёкший код'})
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s",
                        (_hash(new_password), u['id']))
            cur.execute("UPDATE password_resets SET used = TRUE WHERE id = %s", (pr['id'],))
            return _resp(200, {'message': 'Пароль обновлён'})

        if method == 'PUT' and action == 'profile':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            name = (body.get('name') or u['name']).strip()
            email = (body.get('email') or '').strip().lower()
            cur.execute("SELECT id FROM users WHERE LOWER(name) = LOWER(%s) AND id <> %s", (name, u['id']))
            if cur.fetchone():
                return _resp(409, {'error': 'Это имя занято'})
            if email:
                cur.execute("SELECT id FROM users WHERE email <> '' AND LOWER(email) = %s AND id <> %s",
                            (email, u['id']))
                if cur.fetchone():
                    return _resp(409, {'error': 'Эта почта занята'})
            cur.execute("UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING *",
                        (name, email, u['id']))
            return _resp(200, {'user': _user_dto(cur.fetchone())})

        if method == 'POST' and action == 'upload':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            data_url = body.get('image') or ''
            if not data_url.startswith('data:'):
                return _resp(400, {'error': 'Неверный формат изображения'})
            url = _upload_image(data_url)
            return _resp(200, {'url': url})

        if method == 'POST' and action == 'post':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            if u['id'] > 5:
                return _resp(403, {'error': 'Постить могут только UID 1-5'})
            title = (body.get('title') or '').strip()
            price = (body.get('price') or '').strip()
            if not title or not price:
                return _resp(400, {'error': 'Заполните название и цену'})
            cur.execute(
                "INSERT INTO posts (user_id, author, title, description, price, link, image) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
                (u['id'], u['name'], title, body.get('description', ''), price,
                 body.get('link', ''), body.get('image', '')),
            )
            return _resp(200, {'post': dict(cur.fetchone())})

        if method == 'DELETE' and action == 'post':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            post_id = body.get('id') or params.get('id')
            if not post_id:
                return _resp(400, {'error': 'Не указан пост'})
            cur.execute("SELECT * FROM posts WHERE id = %s", (int(post_id),))
            post = cur.fetchone()
            if not post:
                return _resp(404, {'error': 'Пост не найден'})
            if post['user_id'] != u['id']:
                return _resp(403, {'error': 'Можно удалять только свои посты'})
            cur.execute("DELETE FROM posts WHERE id = %s", (post['id'],))
            return _resp(200, {'deleted': post['id']})

        if method == 'POST' and action == 'review':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            text = (body.get('text') or '').strip()
            if not text:
                return _resp(400, {'error': 'Напишите текст отзыва'})
            rating = int(body.get('rating') or 5)
            cur.execute(
                "INSERT INTO reviews (user_id, author, text, rating) VALUES (%s, %s, %s, %s) RETURNING *",
                (u['id'], u['name'], text, rating),
            )
            return _resp(200, {'review': dict(cur.fetchone())})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
