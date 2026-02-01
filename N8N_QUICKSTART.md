# 🎯 Быстрый старт - n8n Avatar Generation

## 📦 Готовые файлы для импорта

Выбери один из вариантов:

### ⭐ Вариант 1: fal.ai (РЕКОМЕНДУЕТСЯ)
- **Файл**: `/app/backend/n8n_workflow_lifequest_avatar_fal.json`
- **API**: fal.ai FLUX Pro v1.1 Ultra
- **Качество**: ⭐⭐⭐⭐⭐
- **Скорость**: Быстро (10-15 сек)
- **Цена**: $0.04-0.08 за изображение

### Вариант 2: Google Gemini
- **Файл**: `/app/backend/n8n_workflow_lifequest_avatar.json`
- **API**: Gemini Nano Banana (Imagen 3.0)
- **Качество**: ⭐⭐⭐⭐
- **Скорость**: Средне (15-20 сек)
- **Цена**: Зависит от Google тарифа

---

## 🚀 3 шага для запуска

### Шаг 1: Импортируй workflow (1 минута)

```bash
1. Открой n8n
2. Меню → Import from File
3. Выбери файл (fal.ai или Gemini)
4. Нажми Import
```

### Шаг 2: Добавь API ключ (2 минуты)

#### Для fal.ai:
```bash
1. Регистрация: https://fal.ai/dashboard
2. Получи ключ: https://fal.ai/dashboard/keys
3. n8n → Settings → Environment variables
4. Добавь: FAL_AI_API_KEY=твой_ключ
```

#### Для Gemini:
```bash
1. Получи ключ: https://makersuite.google.com/app/apikey
2. n8n → Settings → Environment variables
3. Добавь: GOOGLE_API_KEY=твой_ключ
```

### Шаг 3: Подключи к backend (1 минута)

```bash
# 1. Активируй workflow в n8n (переключатель Active)
# 2. Скопируй Webhook URL (в первой ноде)
# 3. Добавь в backend:

nano /app/backend/.env
# Добавь строку:
N8N_WEBHOOK_URL=https://твой-n8n.app/webhook/lifequest-avatar

# 4. Перезапусти backend
sudo supervisorctl restart backend
```

---

## 📊 Схема работы workflow

```
┌─────────────────┐
│  Webhook        │ ← Backend отправляет данные пользователя
│  Trigger        │    (selfie_url, branch, gender, age, level)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate       │ ← Создает промпт на основе данных:
│  Prompt         │    "3D cartoon, wearing [одежда по ветке]..."
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Call AI API    │ ← Генерирует аватар (image-to-image)
│  (fal.ai)       │    Использует селфи как reference
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Process        │ ← Извлекает URL сгенерированного
│  Response       │    изображения из ответа API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send to        │ ← Отправляет avatar_url в backend:
│  Backend        │    POST /api/webhooks/avatar-generated
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Webhook        │ ← Возвращает success response
│  Response       │
└─────────────────┘
```

---

## 🎨 Примеры промптов

### Power (Спортивная одежда)
```
3D cartoon character, pixar-like quality,
wearing athletic sportswear: black hoodie, grey joggers, white sneakers,
confident pose, vibrant colors, clean gradient background
```
![Power Avatar Style](https://placehold.co/300x300/FF6B35/FFF?text=Power+🔥)

### Stability (Деловой casual)
```
3D cartoon character, pixar-like quality,
wearing business casual: blue shirt, beige chinos, loafers,
calm pose, professional look, clean gradient background
```
![Stability Avatar Style](https://placehold.co/300x300/4ECDC4/FFF?text=Stability+🧘)

### Longevity (Комфортный casual)
```
3D cartoon character, pixar-like quality,
wearing comfortable casual: t-shirt, jeans, sneakers,
relaxed pose, healthy look, clean gradient background
```
![Longevity Avatar Style](https://placehold.co/300x300/4CAF50/FFF?text=Longevity+🌱)

---

## ✅ Проверка работы

### Тест 1: Webhook доступен
```bash
curl https://твой-n8n.app/webhook/lifequest-avatar
# Ответ: 200 OK или 405 Method Not Allowed (это нормально!)
```

### Тест 2: Генерация работает
```bash
curl -X POST https://твой-n8n.app/webhook/lifequest-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "tg_id": 123456789,
    "selfie_url": "https://example.com/test.jpg",
    "branch": "power",
    "gender": "male",
    "age": 25,
    "level": 1
  }'
```

### Тест 3: Backend получает аватар
```bash
tail -f /var/log/supervisor/backend.out.log
# Должно быть: POST /api/webhooks/avatar-generated - 200 OK
```

---

## 🛠️ Кастомизация

### Изменить одежду по веткам

Открой workflow → node "Generate Prompt" → Edit:

```javascript
const clothingStyles = {
  power: {
    male: 'wearing athletic sportswear: black hoodie...',
    female: 'wearing athletic sportswear: sports top...'
  },
  // Измени на свой стиль!
};
```

### Изменить качество генерации

В node "Call AI API":

```json
{
  "num_inference_steps": 50,  // ↑ = лучше (медленнее)
  "guidance_scale": 7.5,       // ↑ = точнее промпту
  "strength": 0.70             // ↓ = больше похоже на оригинал
}
```

---

## ❓ Troubleshooting

### ❌ Error: "API key not found"
**Решение:** Добавь API ключ в Environment variables n8n

### ❌ Error: "Webhook URL not set"
**Решение:** Проверь `.env` файл backend и перезапусти

### ❌ Аватар не похож на селфи
**Решение:** Увеличь параметр `strength` до 0.75-0.80

### ❌ Слишком долго генерируется
**Решение:** Уменьши `num_inference_steps` до 30

---

## 💡 Полезные ссылки

- **Детальная инструкция**: `/app/AVATAR_GENERATION_GUIDE.md`
- **fal.ai Dashboard**: https://fal.ai/dashboard
- **Gemini API Keys**: https://makersuite.google.com/app/apikey
- **n8n Docs**: https://docs.n8n.io/

---

**Готово! Теперь пользователи получают крутые 3D аватары! 🎉**
