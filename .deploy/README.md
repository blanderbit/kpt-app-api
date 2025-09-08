# 🐳 Docker Deployment

Эта папка содержит все файлы для Docker развертывания проекта KPT App.

## 📁 Структура файлов

### Docker Compose файлы
- **`docker-compose.dev.yml`** - Development окружение
- **`docker-compose.stg.yml`** - Staging окружение

### Dockerfile файлы
- **`Dockerfile`** - Production образ
- **`Dockerfile.dev`** - Development образ с hot-reload

### Environment файлы
- **`env.dev`** - Переменные для development
- **`env.stg`** - Переменные для staging
- **`env.example`** - Пример переменных окружения

### Дополнительные файлы
- **`.dockerignore`** - Исключения для Docker build

## 🚀 Команды для запуска

### Development окружение
```bash
# Запуск
npm run docker:dev

# Запуск с пересборкой
npm run docker:dev:build

# Остановка
npm run docker:dev:down

# Просмотр логов
npm run docker:dev:logs
```

### Staging окружение
```bash
# Запуск
npm run docker:stg

# Запуск с пересборкой
npm run docker:stg:build

# Остановка
npm run docker:stg:down

# Просмотр логов
npm run docker:stg:logs
```

### Docker образы
```bash
# Сборка production образа
npm run docker:build

# Сборка development образа
npm run docker:build:dev
```

### Очистка Docker
```bash
# Очистка неиспользуемых ресурсов
npm run docker:clean

# Полная очистка (включая образы)
npm run docker:clean:all
```

## 🔧 Настройка окружения

### Development (env.dev)
```bash
# База данных
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=kpt_app_dev
MYSQL_USER=kpt_user
MYSQL_PASSWORD=kpt_password

# Приложение
NODE_ENV=development
PORT=3000
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_NAME=kpt_app_dev
DATABASE_USERNAME=kpt_user
DATABASE_PASSWORD=kpt_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_dev
REDIS_DB=0

# JWT
JWT_SECRET=your-dev-jwt-secret
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Staging (env.stg)
```bash
# База данных
MYSQL_ROOT_PASSWORD=stg_root_password
MYSQL_DATABASE=kpt_app_stg
MYSQL_USER=kpt_stg_user
MYSQL_PASSWORD=kpt_stg_password

# Приложение
NODE_ENV=staging
PORT=3000
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_NAME=kpt_app_stg
DATABASE_USERNAME=kpt_stg_user
DATABASE_PASSWORD=kpt_stg_password

# JWT
JWT_SECRET=your-stg-jwt-secret
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🏗️ Архитектура

### Development окружение
- **API**: NestJS приложение с hot-reload
- **Database**: MySQL 8.0
- **Admin**: phpMyAdmin
- **Storage**: MinIO (S3-совместимое хранилище)
- **Cache**: Redis 7 (с паролем)

### Staging окружение
- **API**: NestJS приложение (production build)
- **Database**: MySQL 8.0
- **Admin**: phpMyAdmin
- **Storage**: MinIO (S3-совместимое хранилище)
- **Cache**: Redis 7 (с паролем)

## 📊 Порты

### Development
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **MySQL**: localhost:3307
- **phpMyAdmin**: http://localhost:8081
- **MinIO**: http://localhost:9002
- **Redis**: localhost:6379

### Staging
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **MySQL**: localhost:3306
- **phpMyAdmin**: http://localhost:8080
- **MinIO**: http://localhost:9000
- **Redis**: localhost:6379

## 🔍 Мониторинг

### Просмотр логов
```bash
# Все сервисы
npm run docker:dev:logs

# Конкретный сервис
docker-compose -f .deploy/docker-compose.dev.yml logs -f api
docker-compose -f .deploy/docker-compose.dev.yml logs -f mysql
```

### Статус сервисов
```bash
docker-compose -f .deploy/docker-compose.dev.yml ps
docker-compose -f .deploy/docker-compose.stg.yml ps
```

### Использование ресурсов
```bash
docker stats
```

## 🛠️ Troubleshooting

### Проблемы с портами
Если порты заняты, измените их в docker-compose файлах:
```yaml
ports:
  - "3001:3000"  # Внешний:Внутренний
```

### Проблемы с базой данных
```bash
# Пересоздание базы
npm run docker:dev:down
docker volume rm kpt-app_mysql_data
npm run docker:dev:build
```

### Проблемы с Redis
```bash
# Пересоздание Redis
npm run docker:dev:down
docker volume rm kpt-app_redis_data_dev
npm run docker:dev:build

# Проверка подключения к Redis
docker exec -it kpt-redis-dev redis-cli -a redis_password_dev ping
```

### Очистка Docker
```bash
# Очистка неиспользуемых ресурсов
npm run docker:clean

# Полная очистка
npm run docker:clean:all
```

## 📚 Полезные команды

### Docker Compose
```bash
# Запуск в фоне
docker-compose -f .deploy/docker-compose.dev.yml up -d

# Запуск с пересборкой
docker-compose -f .deploy/docker-compose.dev.yml up -d --build

# Остановка
docker-compose -f .deploy/docker-compose.dev.yml down

# Просмотр логов
docker-compose -f .deploy/docker-compose.dev.yml logs -f

# Статус сервисов
docker-compose -f .deploy/docker-compose.dev.yml ps
```

### Docker
```bash
# Сборка образа
docker build -f .deploy/Dockerfile -t kpt-app:latest .

# Запуск контейнера
docker run -p 3000:3000 kpt-app:latest

# Просмотр образов
docker images

# Просмотр контейнеров
docker ps -a
```

### Redis
```bash
# Подключение к Redis CLI
docker exec -it kpt-redis-dev redis-cli -a redis_password_dev

# Проверка статуса Redis
docker exec -it kpt-redis-dev redis-cli -a redis_password_dev info

# Очистка Redis
docker exec -it kpt-redis-dev redis-cli -a redis_password_dev flushall
```

## 🔐 Безопасность

### Environment файлы
- **НЕ коммитьте** `env.dev` и `env.stg` в git
- Используйте `env.example` как шаблон
- Храните секреты в безопасном месте

### Пароли
- Используйте сложные пароли для production
- Регулярно обновляйте пароли
- Не используйте дефолтные пароли
- **Redis пароли** - используйте разные пароли для dev и staging

---

**Важно:** Перед запуском убедитесь, что Docker и Docker Compose установлены и запущены на вашей системе.
