# 🔧 Настройка Google Drive для Language Module

## 📋 Предварительные требования

1. **Google Cloud Project** - активный проект в Google Cloud Console
2. **Google Drive API** - включенный API для Google Drive
3. **Service Account** - сервисный аккаунт с правами доступа
4. **NestJS приложение** - настроенное приложение с модулем Language

## 🚀 Пошаговая настройка

### 1. Создание Google Cloud Project

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Запомните **Project ID** - он понадобится позже

### 2. Включение Google Drive API

1. В Google Cloud Console перейдите в **APIs & Services** > **Library**
2. Найдите **Google Drive API**
3. Нажмите **Enable**

### 3. Создание Service Account

1. Перейдите в **APIs & Services** > **Credentials**
2. Нажмите **Create Credentials** > **Service Account**
3. Заполните форму:
   - **Name**: `language-module-service`
   - **Description**: `Service account for language management`
4. Нажмите **Create and Continue**
5. Пропустите шаги с ролями (нажмите **Continue**)
6. Нажмите **Done**

### 4. Создание ключа для Service Account

1. В списке Service Accounts найдите созданный аккаунт
2. Нажмите на email аккаунта
3. Перейдите на вкладку **Keys**
4. Нажмите **Add Key** > **Create new key**
5. Выберите **JSON** формат
6. Нажмите **Create**
7. Файл ключа автоматически скачается

### 5. Настройка прав доступа к Google Drive

1. Перейдите в [Google Drive](https://drive.google.com/)
2. Создайте папку для языков (например: `KPT App Languages`)
3. Скопируйте ID папки из URL
4. Поделитесь папкой с email Service Account:
   - Нажмите правой кнопкой на папку
   - Выберите **Share**
   - Введите email Service Account
   - Установите права **Editor**
   - Нажмите **Send**

### 6. Настройка NestJS приложения

#### Установка зависимостей

```bash
npm install googleapis
npm install @types/node --save-dev
```

#### Конфигурация переменных окружения

Добавьте в `.env` файл:

```env
# Google Drive Configuration
GOOGLE_DRIVE_KEY_FILE=./data/languages/google-drive-key.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id
```

#### Размещение ключа

1. Переименуйте скачанный файл ключа в `google-drive-key.json`
2. Поместите его в папку `data/languages/`
3. Убедитесь, что файл добавлен в `.gitignore`

### 7. Тестирование подключения

После запуска приложения проверьте подключение:

```bash
curl -X GET "http://localhost:3000/admin/languages/google-drive/test-connection" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 Безопасность

### Важные моменты

1. **Никогда не коммитьте ключи** в Git репозиторий
2. **Используйте переменные окружения** для конфигурации
3. **Ограничьте права** Service Account только необходимыми
4. **Регулярно ротируйте ключи** для безопасности

### Рекомендуемые настройки

```env
# Production
GOOGLE_DRIVE_KEY_FILE=/etc/secrets/google-drive-key.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=production-folder-id

# Development
GOOGLE_DRIVE_KEY_FILE=./data/languages/google-drive-key.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=dev-folder-id
```

## 📁 Структура папок в Google Drive

```
Google Drive
└── KPT App Languages/                    # Корневая папка
    ├── en.json                           # Английский язык
    ├── ru.json                           # Русский язык
    ├── es.json                           # Испанский язык
    ├── fr.json                           # Французский язык
    └── Archived Languages/               # Архивная папка
        ├── old-en-v1.json               # Старые версии
        └── deprecated-ru.json           # Устаревшие языки
```

## 🧪 Тестирование

### Тестовые сценарии

1. **Создание языка**
   - Создайте новый язык через API
   - Проверьте, что файл появился в Google Drive
   - Убедитесь, что запись создалась в базе данных

2. **Синхронизация**
   - Измените файл в Google Drive
   - Синхронизируйте через API
   - Проверьте обновление в базе данных

3. **Архивирование**
   - Архивируйте язык через API
   - Проверьте перемещение в архивную папку
   - Убедитесь, что статус изменился в базе

### Команды для тестирования

```bash
# Создание языка
curl -X POST "http://localhost:3000/admin/languages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "de",
    "name": "German",
    "nativeName": "Deutsch",
    "direction": "ltr"
  }'

# Синхронизация
curl -X POST "http://localhost:3000/admin/languages/1/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"force": true}'

# Получение статистики
curl -X GET "http://localhost:3000/admin/languages/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Устранение неполадок

### Частые проблемы

1. **"Google Drive API initialization failed"**
   - Проверьте путь к файлу ключа
   - Убедитесь, что API включен в Google Cloud Console

2. **"Permission denied"**
   - Проверьте права доступа к папке в Google Drive
   - Убедитесь, что Service Account имеет права Editor

3. **"File not found"**
   - Проверьте ID папки в переменных окружения
   - Убедитесь, что папка существует и доступна

4. **"Authentication failed"**
   - Проверьте корректность ключа Service Account
   - Убедитесь, что ключ не истек

### Логи и отладка

Включите подробное логирование в NestJS:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

## 📚 Дополнительные ресурсы

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

## 🔄 Обновление и поддержка

### Регулярные задачи

1. **Мониторинг квот API** - проверяйте использование Google Drive API
2. **Ротация ключей** - обновляйте ключи Service Account
3. **Аудит доступа** - проверяйте логи доступа к папкам
4. **Резервное копирование** - сохраняйте важные языковые файлы

### Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Убедитесь в корректности конфигурации
3. Проверьте статус Google Drive API
4. Обратитесь к документации Google Cloud

---

**Успешной настройки! 🎉**
