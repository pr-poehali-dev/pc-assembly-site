import json
import os
import hashlib
import secrets
import psycopg2
import psycopg2.extras


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash(password: str) -> str:
    return hashlib.sha256(('novapc_salt_' + password).encode()).hexdigest()


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
        'email': row['email'],
        'registeredAt': row['created_at'].strftime('%d.%m.%Y') if row['created_at'] else '',
    }


def handler(event: dict, context) -> dict:
    '''API для сайта сборки ПК: регистрация, вход, профиль, посты и отзывы'''
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
            rows = cur.fetchall()
            return _resp(200, {'posts': [dict(r) for r in rows]})

        if method == 'GET' and action == 'reviews':
            cur.execute("SELECT * FROM reviews ORDER BY created_at DESC")
            rows = cur.fetchall()
            return _resp(200, {'reviews': [dict(r) for r in rows]})

        if method == 'GET' and action == 'me':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            return _resp(200, {'user': _user_dto(u)})

        if method == 'POST' and action == 'register':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not name or not email or not password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'Почта уже зарегистрирована'})
            new_token = secrets.token_hex(24)
            cur.execute(
                "INSERT INTO users (name, email, password_hash, token) VALUES (%s, %s, %s, %s) RETURNING *",
                (name, email, _hash(password), new_token),
            )
            u = cur.fetchone()
            return _resp(200, {'token': new_token, 'user': _user_dto(u)})

        if method == 'POST' and action == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not email or not password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            u = cur.fetchone()
            if not u or u['password_hash'] != _hash(password):
                return _resp(401, {'error': 'Неверная почта или пароль'})
            new_token = secrets.token_hex(24)
            cur.execute("UPDATE users SET token = %s WHERE id = %s", (new_token, u['id']))
            return _resp(200, {'token': new_token, 'user': _user_dto(u)})

        if method == 'PUT' and action == 'profile':
            u = _user_by_token(cur, token)
            if not u:
                return _resp(401, {'error': 'Не авторизован'})
            name = (body.get('name') or u['name']).strip()
            email = (body.get('email') or u['email']).strip().lower()
            cur.execute("SELECT id FROM users WHERE email = %s AND id <> %s", (email, u['id']))
            if cur.fetchone():
                return _resp(409, {'error': 'Эта почта занята'})
            cur.execute("UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING *",
                        (name, email, u['id']))
            updated = cur.fetchone()
            return _resp(200, {'user': _user_dto(updated)})

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
