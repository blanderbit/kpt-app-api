# GitLab CI/CD Setup

## 🚀 Что делает этот pipeline:

1. **Подключается к серверу по SSH**
2. **Останавливает Docker контейнеры**
3. **Собирает Docker образ на сервере**
4. **Запускает новые контейнеры**
5. **Очищает лишние Docker ресурсы**
6. **Проверяет здоровье приложения**

## ⚙️ Настройка GitLab Variables

Добавьте в GitLab → Settings → CI/CD → Variables:

| Переменная | Описание | Пример |
|------------|----------|---------|
| `SSH_PRIVATE_KEY` | Приватный SSH ключ | Содержимое файла `~/.ssh/id_rsa` |
| `SSH_KNOWN_HOSTS` | SSH fingerprint сервера | Вывод команды `ssh-keyscan your-server-ip` |
| `SSH_USER` | Пользователь для SSH | `ubuntu` или `root` |
| `SSH_HOST` | IP или домен сервера | `192.168.1.100` |
| `PROJECT_PATH` | Путь к проекту на сервере | `/opt/kpt-app` |
| `STAGING_PROJECT_PATH` | Путь к staging проекту | `/opt/kpt-app-staging` |
| `APP_PORT` | Порт production приложения | `3000` |
| `STAGING_APP_PORT` | Порт staging приложения | `3001` |

## 🔑 Настройка SSH на сервере:

```bash
# Создать SSH ключ
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gitlab_ci

# Добавить в authorized_keys
cat ~/.ssh/gitlab_ci.pub >> ~/.ssh/authorized_keys

# Установить права
chmod 600 ~/.ssh/gitlab_ci
chmod 644 ~/.ssh/authorized_keys

# Получить fingerprint сервера
ssh-keyscan your-server-ip
```

## 📁 Структура на сервере:

```
/opt/kpt-app/
├── .deploy/
│   ├── docker-compose.prod.yml
│   ├── docker-compose.stg.yml
│   ├── Dockerfile
│   └── Dockerfile.stg
├── src/
└── package.json
```

## 🚀 Использование:

- **Push в `main`** → Запускает `deploy_production`
- **Push в `develop`** → Запускает `deploy_staging`
- **Ручной запуск** → Через GitLab CI/CD → Pipelines

## 🆘 Rollback:

Если что-то пошло не так, используйте job `rollback` для отката к предыдущей версии.

## ✅ Проверка:

После деплоя проверьте:
- Статус контейнеров: `docker-compose ps`
- Логи: `docker-compose logs -f`
- Health check: `curl http://localhost:3000/health`
