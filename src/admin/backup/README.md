# Backup Module

Модуль для создания бэкапов базы данных MySQL и загрузки их на Google Drive.

## Файлы

- `backup.database.service.ts` - Сервис для работы с бэкапами базы данных
- `backup.controller.ts` - Контроллер с API эндпоинтами
- `backup.module.ts` - NestJS модуль
- `index.ts` - Экспорты модуля

## Функции

- **Создание бэкапов**: Создание SQL дампов базы данных MySQL
- **Загрузка на Google Drive**: Автоматическая загрузка бэкапов в облако
- **Список бэкапов**: Просмотр всех доступных бэкапов
- **Скачивание бэкапов**: Скачивание бэкапов с Google Drive
- **Проверка состояния**: Проверка доступности сервисов

## Конфигурация

### Переменные окружения

```env
# Конфигурация базы данных
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=kpt

# Google Drive
BACKUP_FOLDER_ID=your_google_drive_folder_id
```

### Требования

- **mysqldump**: Утилита для создания дампов MySQL (должна быть установлена в системе)
- **Google Drive API**: Настроенный сервисный аккаунт Google Drive

## API Эндпоинты

### POST `/backup/create`
Создает бэкап базы данных и загружает его на Google Drive.

**Ответ:**
```json
{
  "success": true,
  "backupPath": "/path/to/backup.sql",
  "fileId": "google_drive_file_id",
  "message": "Backup created and uploaded to Google Drive successfully"
}
```

### POST `/backup/create-local`
Создает только локальный бэкап (без загрузки на Google Drive).

**Ответ:**
```json
{
  "success": true,
  "backupPath": "/path/to/backup.sql",
  "message": "Database backup created successfully: kpt-backup-2024-01-15T10-30-00-000Z.sql"
}
```

### GET `/backup/list`
Получает список всех бэкапов с Google Drive.

**Ответ:**
```json
{
  "success": true,
  "backups": [
    {
      "id": "file_id",
      "name": "kpt-backup-2024-01-15T10-30-00-000Z.sql",
      "size": 1024000,
      "createdTime": "2024-01-15T10:30:00.000Z",
      "modifiedTime": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Found 5 backup files"
}
```

### GET `/backup/download/:fileId`
Скачивает бэкап с Google Drive по ID файла.

**Ответ:** Файл SQL дампа

### POST `/backup/restore/:fileName`
Восстанавливает базу данных из бэкапа по имени файла.

**Параметры:**
- `fileName`: Имя файла бэкапа (например: `kpt-backup-2024-01-15T10-30-00-000Z.sql`)

**Ответ:**
```json
{
  "success": true,
  "message": "Database restored successfully from backup: kpt-backup-2024-01-15T10-30-00-000Z.sql"
}
```

### GET `/backup/health`
Проверяет состояние сервиса бэкапов.

**Ответ:**
```json
{
  "mysqldumpAvailable": true,
  "googleDriveAvailable": true,
  "message": "mysqldump: available, Google Drive: available"
}
```

## Безопасность

Все эндпоинты требуют:
- JWT аутентификации (`JwtAuthGuard`)
- Права администратора (`RolesGuard`)

## Использование

### Создание бэкапа

```bash
# Создать и загрузить бэкап
curl -X POST http://localhost:3000/backup/create \
  -H "Authorization: Bearer <jwt_token>"

# Создать только локальный бэкап
curl -X POST http://localhost:3000/backup/create-local \
  -H "Authorization: Bearer <jwt_token>"
```

### Получение списка бэкапов

```bash
curl -X GET http://localhost:3000/backup/list \
  -H "Authorization: Bearer <jwt_token>"
```

### Скачивание бэкапа

```bash
curl -X GET http://localhost:3000/backup/download/file_id \
  -H "Authorization: Bearer <jwt_token>" \
  -o backup.sql
```

### Восстановление базы данных

```bash
curl -X POST http://localhost:3000/backup/restore/kpt-backup-2024-01-15T10-30-00-000Z.sql \
  -H "Authorization: Bearer <jwt_token>"
```

## Особенности

1. **Автоматическое удаление**: Локальные файлы бэкапов удаляются после успешной загрузки на Google Drive
2. **Именование файлов**: Файлы именуются с временной меткой: `kpt-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql`
3. **Восстановление по имени**: Можно восстановить базу данных по имени файла бэкапа
4. **Автоматическая очистка**: Бэкапы старше 5 дней автоматически удаляются
5. **Проверка доступности**: Сервис проверяет доступность mysqldump и Google Drive перед выполнением операций
6. **Обработка ошибок**: Подробные сообщения об ошибках с соответствующими кодами

## Коды ошибок

- `BACKUP_DATABASE_FAILED` (8501) - Ошибка создания бэкапа базы данных
- `BACKUP_UPLOAD_FAILED` (8502) - Ошибка загрузки на Google Drive
- `BACKUP_DOWNLOAD_FAILED` (8503) - Ошибка скачивания с Google Drive
- `BACKUP_LIST_FAILED` (8504) - Ошибка получения списка бэкапов
- `BACKUP_MYSQLDUMP_NOT_AVAILABLE` (8506) - mysqldump недоступен
- `BACKUP_GOOGLE_DRIVE_UNAVAILABLE` (8507) - Google Drive недоступен
- `BACKUP_RESTORE_FAILED` (8511) - Ошибка восстановления базы данных
