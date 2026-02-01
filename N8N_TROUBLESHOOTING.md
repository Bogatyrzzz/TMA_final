# 🔍 Диагностика n8n Workflow

## Проблема
n8n получает запрос (200 OK), но не отправляет результат обратно в backend.

---

## ✅ Чек-лист проверки workflow

### 1. Проверь что workflow АКТИВЕН
- Открой workflow в n8n
- Переключатель **Active** должен быть включен (синий)

### 2. Проверь выполнение workflow
- n8n → **Executions** (внизу справа)
- Найди последнее выполнение
- **ДОЛЖНО БЫТЬ:** Все ноды зеленые (успех)
- **ЕСЛИ КРАСНЫЕ:** Кликни на красную ноду и посмотри ошибку

### 3. Проверь каждую ноду

#### Нода 1: Webhook Trigger
✅ **Проверь:**
- HTTP Method: `POST`
- Path: `lifequest-avatar`
- Response Mode: `responseNode` (важно!)

#### Нода 2: Generate Prompt (Code)
✅ **Проверь:**
- В логах executions должны быть данные: `user_id`, `prompt`, `strength`
- Если пусто - проблема в коде

#### Нода 3: Call AI API
⚠️ **САМАЯ ЧАСТАЯ ПРОБЛЕМА!**

**Для fal.ai проверь:**
```
URL: https://fal.run/fal-ai/flux-pro/v1.1-ultra
Method: POST
Headers:
  - Authorization: Key {{ $env.FAL_AI_API_KEY }}
  - Content-Type: application/json
```

**Проверь Body:**
```json
{
  "prompt": "{{ $json.prompt }}",
  "image_url": "{{ $json.selfie_url }}",
  "negative_prompt": "{{ $json.negative_prompt }}",
  "num_inference_steps": 50,
  "guidance_scale": 7.5,
  "strength": {{ $json.strength }},
  "num_images": 1,
  "output_format": "jpeg"
}
```

**🔴 Частые ошибки:**
- API key не установлен в Environment Variables
- Неправильный синтаксис в Body (должен быть raw JSON, не JSON)
- Timeout слишком маленький (поставь 300000 = 5 минут)

#### Нода 4: Process Image Response
✅ **Проверь в execution:**
- Должен быть `avatar_url` в выходных данных
- Если пусто - проблема в парсинге ответа API

#### Нода 5: Send to Backend
✅ **Проверь:**
```
URL: https://quest-hero-3.preview.emergentagent.com/api/webhooks/avatar-generated
Method: POST
Body Type: JSON
Body:
{{ JSON.stringify($json) }}
```

⚠️ **Важно:** Body должен быть в формате JSON string!

#### Нода 6: Webhook Response
✅ **Проверь:**
- Response Mode: `json`
- Response Body должен быть установлен

---

## 🧪 Тест 1: Минимальный workflow

Создай простой workflow для теста:

```
Webhook Trigger
    ↓
Webhook Response (сразу отвечает)
```

**Webhook Response body:**
```json
{
  "success": true,
  "message": "Test OK",
  "received": {{ JSON.stringify($json) }}
}
```

**Тест:**
```bash
curl -X POST https://n8n9976.hostkey.in/webhook/lifequest-avatar \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "message": "Test OK",
  "received": {"test": "data"}
}
```

---

## 🧪 Тест 2: Без AI генерации

Временно пропусти AI ноду и используй заглушку:

```
Webhook Trigger
    ↓
Set Test Avatar (Code Node)
    ↓
Send to Backend
    ↓
Webhook Response
```

**Code Node "Set Test Avatar":**
```javascript
const userData = $input.item.json;

return {
  user_id: userData.user_id,
  tg_id: userData.tg_id,
  avatar_url: 'https://placehold.co/400x400/FF6B35/FFF?text=Test+Avatar',
  level: userData.level || 1,
  branch: userData.branch || 'power'
};
```

---

## 🐛 Типичные ошибки в n8n

### Ошибка 1: "Cannot read property..."
**Причина:** Неправильный доступ к данным из предыдущей ноды

**Решение:** Используй `$json` вместо `$input.item.json` в некоторых нодах

### Ошибка 2: API key not found
**Причина:** Environment variable не установлена

**Решение:**
1. n8n Settings → Variables
2. Добавь: `FAL_AI_API_KEY` или `GOOGLE_API_KEY`
3. Сохрани и перезапусти workflow

### Ошибка 3: Timeout
**Причина:** AI генерация занимает >30 сек

**Решение:** В HTTP Request ноде:
- Options → Timeout → 300000 (5 минут)

### Ошибка 4: 401 Unauthorized от fal.ai
**Причина:** Неправильный формат Authorization header

**Должно быть:**
```
Authorization: Key ваш_ключ_без_кавычек
```

**НЕ должно быть:**
```
Authorization: Bearer ваш_ключ
```

---

## 📊 Проверка логов

### В n8n:
1. Executions → выбери последний
2. Кликни на каждую ноду
3. Посмотри Input и Output
4. Если красная - посмотри Error

### В backend:
```bash
# Все логи
tail -f /var/log/supervisor/backend.out.log

# Только webhook
tail -f /var/log/supervisor/backend.out.log | grep avatar-generated
```

**Должно быть:**
```
POST /api/webhooks/avatar-generated - 200 OK
```

---

## 🔧 Исправленный простой workflow

Сохрани как `n8n_workflow_simple_test.json`:

```json
{
  "name": "LifeQuest Avatar - Simple Test",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "lifequest-avatar",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "// Получаем данные\nconst data = $input.item.json;\n\n// Создаем тестовый аватар\nreturn {\n  user_id: data.user_id,\n  tg_id: data.tg_id,\n  avatar_url: 'https://placehold.co/400x400/FF6B35/FFF?text=Level+' + (data.level || 1),\n  level: data.level || 1,\n  branch: data.branch || 'power',\n  test_mode: true\n};"
      },
      "name": "Create Test Avatar",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://quest-hero-3.preview.emergentagent.com/api/webhooks/avatar-generated",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}"
      },
      "name": "Send to Backend",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, user_id: $json.user_id }) }}"
      },
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Create Test Avatar", "type": "main", "index": 0 }]]
    },
    "Create Test Avatar": {
      "main": [[{ "node": "Send to Backend", "type": "main", "index": 0 }]]
    },
    "Send to Backend": {
      "main": [[{ "node": "Response", "type": "main", "index": 0 }]]
    }
  }
}
```

**Импортируй и протестируй этот workflow!**

---

## ✅ Следующие шаги

1. **Импортируй простой тестовый workflow** (выше)
2. **Активируй его**
3. **Протестируй:**
```bash
curl -X POST https://n8n9976.hostkey.in/webhook/lifequest-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "tg_id": 999888777,
    "level": 5,
    "branch": "power"
  }'
```

4. **Проверь backend:**
```bash
tail -f /var/log/supervisor/backend.out.log | grep avatar-generated
```

5. **Должно быть:** 
   - n8n вернул JSON с `success: true`
   - Backend получил POST на `/api/webhooks/avatar-generated`

6. **Проверь пользователя:**
```bash
curl -s https://quest-hero-3.preview.emergentagent.com/api/users/999888777 | jq .avatar_url
```
   - Должен быть URL вида: `https://placehold.co/400x400/...`

---

**Если тест прошел успешно** - можно добавлять AI генерацию!

**Пришли скриншот executions из n8n** если что-то не работает! 📸
