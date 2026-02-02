## LifeQuest Hero — текущее состояние

### Обзор
Полноценное приложение с Telegram Mini App фронтендом и FastAPI бэкендом. Пользовательский прогресс и данные хранятся в Supabase. Генерация аватаров выполняется через внешний n8n workflow, который отдает готовый URL в webhook бэкенда.

### Стек
- Frontend: React, Tailwind CSS, Framer Motion, lucide-react
- Backend: FastAPI, Python
- Database/Storage: Supabase (PostgreSQL + Storage)
- Integrations: Telegram Mini App SDK, n8n webhook

### Структура репозитория
- backend/server.py — основной FastAPI сервер и webhook для аватаров
- backend/supabase_schema.sql — схема базы данных
- frontend/src/App.js — точка входа и инициализация Telegram
- frontend/src/components/HomeScreen.js — главный экран и фон-аватар
- frontend/src/components/Onboarding.js — онбординг
- frontend/src/lib/api.js — API клиент

### Переменные окружения
Frontend (.env):
- REACT_APP_BACKEND_URL
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Backend (.env):
- SUPABASE_URL
- SUPABASE_KEY
- N8N_WEBHOOK_URL

### Основные эндпоинты API
- POST /api/users/register — регистрация пользователя
- GET /api/users/{tg_id} — получение данных пользователя
- POST /api/users/{tg_id}/onboarding — завершение онбординга
- GET /api/users/{tg_id}/progress — прогресс
- GET /api/users/{tg_id}/quests — список квестов
- POST /api/users/{tg_id}/quests/complete — завершение квеста
- POST /api/webhooks/avatar-generated — webhook для аватара

### Генерация аватара
1) Онбординг отправляет данные в n8n.
2) n8n генерирует изображение и загружает его в Supabase Storage (bucket avatars).
3) n8n вызывает /api/webhooks/avatar-generated с avatar_url.
4) Бэкенд сохраняет avatar_url в users.

### Текущее состояние
- UI стабилен, основные экраны работают.
- Аватар используется как фон и как основной портрет.
- Все ссылки на сторонние сервисы в интерфейсе удалены.
- В регистрации очищаются URL аватаров, если они не из Supabase.

### Запуск
Frontend:
- cd frontend
- yarn start

Backend:
- cd backend
- uvicorn server:app --host 0.0.0.0 --port 8000

### Тестовые данные
- Test user: tg_id=123456789
- API URL: https://your-backend-url
