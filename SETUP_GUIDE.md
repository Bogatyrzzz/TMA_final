# 🚀 ИНСТРУКЦИЯ ПО ЗАПУСКУ LIFEQUEST HERO

## ⚠️ ВАЖНО! Необходимые шаги перед использованием

### 1️⃣ Создание таблиц в Supabase (ОБЯЗАТЕЛЬНО!)

**Без этого шага приложение НЕ БУДЕТ работать!**

1. Открой Supabase Dashboard: https://supabase.com/dashboard/project/ppzuwsmexjmjgrdylcvw

2. В левом меню выбери **SQL Editor**

3. Нажми **New query**

4. Скопируй весь SQL код из файла `/app/backend/supabase_schema.sql` и вставь в редактор

5. Нажми **Run** (или F5)

6. Дождись успешного выполнения (должно быть "Success. No rows returned")

7. Проверь что таблицы созданы:
   - Перейди в **Table Editor**
   - Должны быть таблицы: users, progress, quests, user_quests, transactions, avatar_generations

### 2️⃣ Настройка Telegram Mini App

1. Открой @BotFather в Telegram

2. Отправь команду: `/mybots`

3. Выбери своего бота (или создай нового через `/newbot`)

4. Нажми **Bot Settings** → **Menu Button**

5. Настрой кнопку:
   - Text: `LifeQuest Hero`
   - URL: `https://spec-analyzer-4.preview.emergentagent.com`

### 3️⃣ Настройка n8n для генерации AI-аватаров

**Пока n8n не настроен, аватары не будут генерироваться (будет показываться эмодзи 🦸)**

#### Создай Workflow в n8n:

1. **Webhook Trigger Node**
   - Method: POST
   - Путь: `/lifequest-avatar`
   - Ожидаемые поля:
     ```json
     {
       "user_id": "uuid",
       "tg_id": 123456789,
       "selfie_url": "https://...",
       "branch": "power",
       "gender": "male",
       "age": 25,
       "level": 1
     }
     ```

2. **Function Node** - создание промпта:
   ```javascript
   const branch = $input.item.json.branch;
   const gender = $input.item.json.gender;
   const age = $input.item.json.age;
   const level = $input.item.json.level;
   
   const branchStyles = {
     power: "muscular, strong, confident, wearing red and blue heroic costume",
     stability: "balanced, wise, wearing blue and cyan meditation robes",
     longevity: "healthy, agile, wearing green and emerald athletic gear"
   };
   
   const prompt = `3D cartoon superhero character in Captain America style, ${branchStyles[branch]}, ${gender}, age ${age}, level ${level} hero, vibrant colors, heroic pose, white background, high quality render`;
   
   return { prompt, ...$ input.item.json };
   ```

3. **HTTP Request Node** - Gemini Nano Banana:
   - Method: POST
   - URL: API endpoint для Gemini Image Generation
   - Body: промпт
   - Результат: URL изображения

4. **HTTP Request Node** - отправка результата:
   - Method: POST
   - URL: `https://spec-analyzer-4.preview.emergentagent.com/api/webhooks/avatar-generated`
   - Body:
     ```json
     {
       "user_id": "{{$json.user_id}}",
       "avatar_url": "{{$json.avatar_url}}",
       "level": {{$json.level}}
     }
     ```

5. **Получи URL webhook** и добавь в `.env`:
   ```bash
   # Редактируй файл
   nano /app/backend/.env
   
   # Добавь строку
   N8N_WEBHOOK_URL=https://твой-n8n.com/webhook/lifequest-avatar
   
   # Сохрани (Ctrl+O, Enter, Ctrl+X)
   
   # Перезапусти backend
   sudo supervisorctl restart backend
   ```

## ✅ Проверка работоспособности

### Проверь статус сервисов:
```bash
sudo supervisorctl status
```

Должно быть:
```
backend     RUNNING   pid 1413, uptime 0:10:00
frontend    RUNNING   pid 1453, uptime 0:10:00
```

### Проверь логи:
```bash
# Backend
tail -f /var/log/supervisor/backend.out.log

# Frontend
tail -f /var/log/supervisor/frontend.out.log
```

### Открой приложение:
1. Перейди по ссылке: https://spec-analyzer-4.preview.emergentagent.com
2. Должен открыться экран загрузки, затем онбординг
3. Если ошибка - проверь что таблицы созданы в Supabase!

## 🎯 Тестирование функций

### 1. Онбординг
- Заполни возраст, пол
- Выбери ветку развития
- Поставь цель
- Нажми "Создать героя!"

### 2. Главный экран
- Проверь отображение аватара (🦸 если n8n не настроен)
- Проверь статы (все должны быть = 1)
- Проверь XP бар (0/100)

### 3. Квесты
- Должны загрузиться квесты для выбранной ветки
- Отметь квест как выполненный
- Должен увеличиться XP
- При достижении 100 XP - level up!

### 4. PRO кнопка
- Нажми "🌟 Получить PRO"
- Откроется модалка с описанием
- Кнопка "Активировать PRO" (пока без оплаты, для тестирования)

## 🐛 Решение проблем

### ❌ "Could not find the table 'public.users'"
**Решение:** Выполни SQL скрипт из шага 1️⃣ выше!

### ❌ Frontend показывает белый экран
**Решение:**
```bash
cd /app/frontend
yarn install
sudo supervisorctl restart frontend
```

### ❌ Backend ошибка: "SUPABASE_URL not found"
**Решение:** Проверь файл `.env`:
```bash
cat /app/backend/.env
```
Должны быть:
```
SUPABASE_URL=https://ppzuwsmexjmjgrdylcvw.supabase.co
SUPABASE_KEY=sb_publishable_ptYb11OyzaOyvvXFZBladQ_VhPHa7fu
TELEGRAM_BOT_TOKEN=8087615492:AAGuX0QnWtkpoQBuOYHzb0EqF9qrZ4N-f-Q
```

### ❌ Telegram Bot не отвечает
**Решение:**
1. Проверь токен в `.env`
2. Запусти бота вручную:
```bash
cd /app/backend
python bot.py
```

## 📱 Использование в Telegram

### Вариант 1: Через Menu Button (рекомендуется)
1. Открой бота в Telegram
2. Нажми на иконку меню (≡) рядом с полем ввода
3. Выбери "LifeQuest Hero"

### Вариант 2: Через команду
1. Отправь `/start` боту
2. Нажми кнопку "🦸 Запустить LifeQuest Hero"

### Вариант 3: Прямая ссылка
Открой в Telegram:
```
https://t.me/твой_бот?start=app
```

## 🌟 Дополнительные настройки

### Добавление иконок для веток

Можно заменить эмодзи на красивые иконки:
1. Скачай иконки (SVG или PNG)
2. Загрузи в `/app/frontend/public/icons/`
3. Обнови компонент `Onboarding.js`:
```javascript
const BRANCHES = [
  {
    id: 'power',
    icon: '/icons/power.svg', // вместо '💪'
    ...
  },
  ...
];
```

### Кастомизация квестов

Отредактируй квесты в Supabase:
1. Открой **Table Editor** → **quests**
2. Измени существующие или добавь новые
3. Квесты автоматически загрузятся в приложение

## 📈 Мониторинг

### Проверка активных пользователей:
```sql
-- В Supabase SQL Editor
SELECT COUNT(*) as active_users 
FROM users 
WHERE last_active_at >= NOW() - INTERVAL '1 day';
```

### Статистика квестов:
```sql
SELECT 
  DATE(completion_date) as date,
  COUNT(*) as completed_quests
FROM user_quests
GROUP BY DATE(completion_date)
ORDER BY date DESC;
```

---

## 💡 Полезные команды

```bash
# Перезапуск всех сервисов
sudo supervisorctl restart all

# Остановка сервисов
sudo supervisorctl stop all

# Запуск сервисов
sudo supervisorctl start all

# Просмотр логов в реальном времени
sudo supervisorctl tail -f backend
sudo supervisorctl tail -f frontend

# Проверка портов
netstat -tuln | grep -E ':(3000|8001)'
```

---

**Готово! Теперь можно пользоваться LifeQuest Hero! 🎮**

Если возникли вопросы - проверь логи или напиши в поддержку.
