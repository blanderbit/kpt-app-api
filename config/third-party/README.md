# 🔧 Конфигурации сторонних сервисов

Эта папка содержит примеры конфигураций для различных сторонних сервисов, используемых в приложении.

## 📁 Структура

```
config/third-party/
├── README.md                    # Документация конфигураций
├── google-drive.example.json    # Пример конфигурации Google Drive
├── firebase.example.json        # Пример конфигурации Firebase
├── sendgrid.example.json        # Пример конфигурации SendGrid
├── redis.example.json           # Пример конфигурации Redis
└── openai.example.json          # Пример конфигурации OpenAI
```

## ⚠️ Важно

**Все файлы в этой папке являются примерами и НЕ содержат реальные ключи!**

- **Примеры** - файлы с расширением `.example.json`
- **Реальные конфигурации** - должны быть созданы на основе примеров
- **Безопасность** - реальные файлы НЕ должны попадать в Git

## 🔐 Настройка

### 1. Скопируйте примеры

```bash
# Для Google Drive
cp config/third-party/google-drive.example.json config/third-party/google-drive.json

# Для Firebase
cp config/third-party/firebase.example.json config/third-party/firebase.json

# Для SendGrid
cp config/third-party/sendgrid.example.json config/third-party/sendgrid.json

# Для Redis
cp config/third-party/redis.example.json config/third-party/redis.json

# Для OpenAI
cp config/third-party/openai.example.json config/third-party/openai.json
```

### 2. Заполните реальными данными

Отредактируйте скопированные файлы, заменив placeholder значения на реальные ключи и настройки.

### 3. Добавьте в .gitignore

Убедитесь, что в `.gitignore` добавлены строки:

```gitignore
# Third-party service configurations
config/third-party/*.json
!config/third-party/*.example.json
```

## 🌐 Google Drive

### Настройка

1. Создайте Google Cloud Project
2. Включите Google Drive API
3. Создайте Service Account
4. Скачайте ключ в формате JSON
5. Скопируйте содержимое в `google-drive.json`

### Использование

```typescript
// В .env файле
GOOGLE_DRIVE_KEY_FILE=./config/third-party/google-drive.json
```

## 🔥 Firebase

### Настройка

1. Создайте Firebase проект
2. Перейдите в Project Settings > Service Accounts
3. Создайте новый Service Account
4. Скачайте ключ в формате JSON
5. Скопируйте содержимое в `firebase.json`

### Использование

```typescript
// В .env файле
FIREBASE_CONFIG_FILE=./config/third-party/firebase.json
```

## 📧 SendGrid

### Настройка

1. Создайте аккаунт SendGrid
2. Сгенерируйте API ключ
3. Создайте email шаблоны
4. Заполните конфигурацию в `sendgrid.json`

### Использование

```typescript
// В .env файле
SENDGRID_CONFIG_FILE=./config/third-party/sendgrid.json
```

## 🗄️ Redis

### Настройка

1. Установите Redis сервер
2. Настройте пароль и другие параметры
3. Заполните конфигурацию в `redis.json`

### Использование

```typescript
// В .env файле
REDIS_CONFIG_FILE=./config/third-party/redis.json
```

## 🤖 OpenAI

### Настройка

1. Создайте аккаунт OpenAI
2. Сгенерируйте API ключ
3. Настройте параметры модели
4. Заполните конфигурацию в `openai.json`

### Использование

```typescript
// В .env файле
OPENAI_CONFIG_FILE=./config/third-party/openai.json
```

## 🔒 Безопасность

### Рекомендации

1. **Никогда не коммитьте** реальные ключи в Git
2. **Используйте переменные окружения** для чувствительных данных
3. **Регулярно ротируйте** API ключи
4. **Ограничивайте права** Service Accounts
5. **Мониторьте использование** API

### Переменные окружения

Для дополнительной безопасности используйте переменные окружения:

```env
# Google Drive
GOOGLE_DRIVE_KEY_FILE=./config/third-party/google-drive.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id

# Firebase
FIREBASE_CONFIG_FILE=./config/third-party/firebase.json

# SendGrid
SENDGRID_CONFIG_FILE=./config/third-party/sendgrid.json

# Redis
REDIS_CONFIG_FILE=./config/third-party/redis.json

# OpenAI
OPENAI_CONFIG_FILE=./config/third-party/openai.json
```

## 🧪 Тестирование

### Проверка конфигураций

После настройки проверьте подключения:

```bash
# Google Drive
curl -X GET "http://localhost:3000/admin/languages/google-drive/test-connection"

# Firebase (если есть endpoint)
curl -X GET "http://localhost:3000/api/firebase/test"

# Redis (если есть endpoint)
curl -X GET "http://localhost:3000/api/redis/test"
```

## 📚 Дополнительные ресурсы

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [SendGrid Dashboard](https://app.sendgrid.com/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Успешной настройки! 🎉**
