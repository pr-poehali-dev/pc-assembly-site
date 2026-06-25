-- email остаётся NOT NULL, но пустая строка = "почта не указана"
ALTER TABLE users ALTER COLUMN email SET DEFAULT '';

-- снимаем глобальную уникальность почты
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX idx_users_email_unique ON users (LOWER(email)) WHERE email <> '';

-- имя уникально и используется для входа
CREATE UNIQUE INDEX idx_users_name_unique ON users (LOWER(name));

CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    code VARCHAR(8) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id);