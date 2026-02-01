# 🎨 Генерация AI-Аватаров для LifeQuest Hero

## 📝 Важные правки по генерации аватаров

### ✅ Правильный подход:

1. **Аватар генерируется НА ОСНОВЕ селфи пользователя** (image-to-image)
2. **Обычная одежда** - НЕ супергеройские костюмы!
3. **3D мультяшная рисовка** - как на референсе (яркий, детализированный, Pixar-style)
4. **Одежда зависит от ветки**:
   - **Power**: Спортивная одежда (худи, джоггеры)
   - **Stability**: Деловой casual (рубашка, чиносы)
   - **Longevity**: Комфортная casual (футболка, джинсы)

---

## 🚀 Варианты интеграции

Я подготовил **2 готовых workflow** для импорта в n8n:

### Вариант 1: Google Gemini Nano Banana
**Файл:** `/app/backend/n8n_workflow_lifequest_avatar.json`

**Преимущества:**
- Отличная работа с image-to-image
- Сохранение черт лица
- Хорошее качество 3D стилизации

**Требования:**
- Google API Key (Gemini)
- Environment variable: `GOOGLE_API_KEY`

### Вариант 2: fal.ai (FLUX Pro)
**Файл:** `/app/backend/n8n_workflow_lifequest_avatar_fal.json`

**Преимущества:**
- FLUX Pro v1.1 Ultra - топовое качество
- Лучшее сохранение деталей лица
- Профессиональный image-to-image

**Требования:**
- fal.ai API Key
- Environment variable: `FAL_AI_API_KEY`

---

## 📥 Импорт workflow в n8n

### Шаг 1: Выбери сервис

**Рекомендация:** Используй **fal.ai** для лучшего качества image-to-image трансформации.

### Шаг 2: Импортируй workflow

1. Открой n8n
2. Нажми на меню **Workflows** → **Import from File**
3. Выбери файл:
   - Для Gemini: `/app/backend/n8n_workflow_lifequest_avatar.json`
   - Для fal.ai: `/app/backend/n8n_workflow_lifequest_avatar_fal.json`
4. Нажми **Import**

### Шаг 3: Настрой API ключи

#### Для Gemini:
1. Получи API key: https://makersuite.google.com/app/apikey
2. В n8n → **Settings** → **Environment variables**
3. Добавь: `GOOGLE_API_KEY=твой_ключ`

#### Для fal.ai:
1. Получи API key: https://fal.ai/dashboard/keys
2. В n8n → **Settings** → **Environment variables**
3. Добавь: `FAL_AI_API_KEY=твой_ключ`

### Шаг 4: Активируй workflow

1. Открой импортированный workflow
2. Нажми **Active** (переключатель в правом верхнем углу)
3. Скопируй **Webhook URL** (он будет в первой ноде "Webhook Trigger")

Пример URL:
```
https://твой-n8n.app.n8n.cloud/webhook/lifequest-avatar
```

### Шаг 5: Добавь webhook в backend

```bash
# Редактируй .env файл
nano /app/backend/.env

# Добавь строку
N8N_WEBHOOK_URL=https://твой-n8n.app.n8n.cloud/webhook/lifequest-avatar

# Сохрани (Ctrl+O, Enter, Ctrl+X)

# Перезапусти backend
sudo supervisorctl restart backend
```

---

## 🎯 Как это работает

### 1. Пользователь завершает онбординг

Frontend отправляет данные в backend:
```javascript
{
  age: 25,
  gender: 'male',
  branch: 'power',
  goal_text: 'Купить новый телефон',
  goal_level: 10,
  selfie_url: 'https://...' // URL селфи пользователя
}
```

### 2. Backend вызывает n8n webhook

```javascript
POST https://твой-n8n.app.n8n.cloud/webhook/lifequest-avatar
{
  user_id: 'uuid',
  tg_id: 123456789,
  selfie_url: 'https://...',
  branch: 'power',
  gender: 'male',
  age: 25,
  level: 1
}
```

### 3. n8n генерирует промпт

**Пример для ветки Power (мужчина):**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing athletic sportswear: black hoodie, grey joggers, white sneakers, 
standing confidently, clean gradient background, vibrant colors, 
smooth textures, professional lighting, high quality render, 
maintaining facial features and hairstyle from reference image
```

**Negative prompt:**
```
superhero costume, cape, mask, armor, weapons, 
low quality, blurry, distorted, ugly, bad anatomy, extra limbs
```

### 4. AI генерирует аватар

- Берет селфи как reference
- Трансформирует в 3D cartoon style
- Сохраняет черты лица и прическу
- Одевает в одежду по ветке

### 5. n8n отправляет результат в backend

```javascript
POST https://quest-hero-3.preview.emergentagent.com/api/webhooks/avatar-generated
{
  user_id: 'uuid',
  avatar_url: 'https://...',
  level: 1
}
```

### 6. Backend обновляет аватар пользователя

- Сохраняет `avatar_url` в таблицу `users`
- Логирует в `avatar_generations`
- Пользователь видит свой аватар в приложении!

---

## 🎨 Примеры промптов по веткам

### Power (Сила) - Спортивный стиль

**Мужчина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing athletic sportswear: black hoodie, grey joggers, white sneakers, 
confident athletic pose, clean gradient background (orange to red), 
vibrant colors, muscular build, energetic expression
```

**Женщина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing athletic sportswear: sports top, black leggings, white sneakers, 
strong confident pose, clean gradient background (orange to red), 
vibrant colors, athletic build, determined expression
```

### Stability (Стабильность) - Деловой casual

**Мужчина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing business casual: blue button-up shirt, beige chinos, brown loafers, 
calm balanced pose, clean gradient background (blue to cyan), 
professional look, wise expression, relaxed but focused
```

**Женщина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing business casual: white blouse, black trousers, elegant flats, 
balanced poised pose, clean gradient background (blue to cyan), 
professional elegant look, serene expression, composed
```

### Longevity (Долголетие) - Комфортный casual

**Мужчина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing comfortable casual: plain t-shirt, blue jeans, comfortable sneakers, 
relaxed peaceful pose, clean gradient background (green to emerald), 
healthy appearance, content smile, natural stance
```

**Женщина:**
```
3D cartoon character, animated movie style, pixar-like quality, 
wearing comfortable casual: casual top, yoga pants, comfortable sneakers, 
peaceful relaxed pose, clean gradient background (green to emerald), 
healthy vibrant look, gentle smile, natural grace
```

---

## 🔧 Настройка параметров генерации

### Уровни детализации (по level пользователя):

```javascript
// В node "Generate Prompt"
const strength = level <= 10 ? 0.75 : level <= 25 ? 0.70 : 0.65;

// Level 1-10: Базовое качество
// Level 11-25: Высокое качество, больше деталей
// Level 26-50: Ультра качество, максимальная полировка
```

### Параметры FLUX Pro:

```json
{
  "num_inference_steps": 50,  // Больше = лучше качество
  "guidance_scale": 7.5,       // Соответствие промпту
  "strength": 0.70,            // Степень трансформации (0.6-0.8)
  "output_format": "jpeg",     // Формат выходного файла
  "safety_tolerance": "2"      // Уровень безопасности
}
```

---

## 🧪 Тестирование

### 1. Тестовый запрос к n8n

```bash
curl -X POST https://твой-n8n.app.n8n.cloud/webhook/lifequest-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "tg_id": 123456789,
    "selfie_url": "https://example.com/test-selfie.jpg",
    "branch": "power",
    "gender": "male",
    "age": 25,
    "level": 1
  }'
```

### 2. Проверь логи n8n

- Открой workflow в n8n
- Нажми **Executions** (внизу справа)
- Посмотри на последние выполнения
- Проверь каждую ноду на ошибки

### 3. Проверь результат в backend

```bash
# Логи backend
tail -f /var/log/supervisor/backend.out.log

# Должно быть:
# POST /api/webhooks/avatar-generated - 200 OK
```

---

## ❓ FAQ

### В: Аватар не генерируется

**Проверь:**
1. n8n workflow активен?
2. API ключи правильные?
3. Webhook URL добавлен в `.env`?
4. Селфи доступно по URL?

### В: Аватар генерируется, но не сохраняет черты лица

**Решение:**
- Увеличь параметр `strength` до 0.75-0.80
- Убедись что используешь image-to-image (не text-to-image!)
- Проверь качество селфи (не должно быть слишком маленьким или размытым)

### В: Одежда не соответствует ветке

**Решение:**
- Проверь логику в node "Generate Prompt"
- Убедись что `branch` передается корректно
- Можешь кастомизировать стили в объекте `clothingStyles`

### В: Генерация слишком долгая

**Оптимизация:**
- Уменьши `num_inference_steps` до 30-40
- Используй fal.ai вместо Gemini (быстрее)
- Установи timeout в backend (5-10 секунд для async)

---

## 🎯 Результат

После настройки пользователи будут получать:

✅ **Персонализированный 3D аватар** на основе их селфи
✅ **Сохранение черт лица** и прически
✅ **Одежда по выбранной ветке** развития
✅ **Качественная рисовка** в стиле Pixar/Disney
✅ **Обновление аватара** каждые 5 уровней

---

**Готово! Импортируй workflow и протестируй! 🚀**
