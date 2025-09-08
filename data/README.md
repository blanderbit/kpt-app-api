# Data Files

Эта папка содержит примеры файлов данных для приложения KPT.

## 📁 Структура файлов

### `activity-types.json`
Пример файла с типами активностей для приложения.

**Содержит:**
- `activityTypes` - массив типов активностей
- `categories` - категории активностей

**Каждый тип активности включает:**
- `id` - уникальный идентификатор
- `name` - название типа
- `description` - описание
- `keywords` - ключевые слова для поиска
- `category` - категория
- `icon` - эмодзи иконка
- `color` - цвет в HEX формате

### `mood-types.json`
Пример файла с типами настроения для трекера настроения.

**Содержит:**
- `moodTypes` - массив типов настроения
- `categories` - категории настроения
- `defaultMood` - ID настроения по умолчанию

**Каждый тип настроения включает:**
- `id` - уникальный идентификатор
- `name` - название типа
- `description` - описание
- `emoji` - эмодзи
- `color` - цвет в HEX формате
- `score` - числовая оценка (1-10)
- `category` - категория (positive/neutral/negative)

## 🚀 Использование

### В продакшене
Эти файлы загружаются из Google Drive через `GoogleDriveFilesService`.

### Для разработки
Можете использовать эти примеры как шаблоны для создания собственных файлов в Google Drive.

## ⚙️ Настройка

Для работы с Google Drive необходимо настроить следующие переменные окружения:

```bash
# Google Drive Configuration
GOOGLE_DRIVE_KEY_FILE=./config/third-party/google-drive.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-google-drive-root-folder-id

# Data Files Configuration
ACTIVITY_TYPES_FILE_ID=your-activity-types-file-id
MOOD_TYPES_FILE_ID=your-mood-types-file-id
LANGUAGES_FOLDER_ID=your-languages-folder-id
```

## 📝 Создание собственных файлов

1. Скопируйте примеры файлов
2. Загрузите их в Google Drive
3. Получите ID файлов
4. Обновите переменные окружения

## 🔄 Обновление данных

Данные обновляются через API endpoints:
- `PUT /admin/activity-types` - обновление типов активностей
- `PUT /admin/mood-types` - обновление типов настроения

## 📊 Структура данных

### Типы активностей
```json
{
  "id": "work",
  "name": "Работа",
  "description": "Профессиональная деятельность и задачи",
  "keywords": ["работа", "задача", "проект"],
  "category": "professional",
  "icon": "💼",
  "color": "#2196F3"
}
```

### Типы настроения
```json
{
  "id": "excellent",
  "name": "Отлично",
  "description": "Превосходное настроение, полный восторг",
  "emoji": "😍",
  "color": "#4CAF50",
  "score": 10,
  "category": "positive"
}
```

## 🚨 Важно

- Эти файлы являются **примерами** и не используются в продакшене
- В продакшене все данные загружаются из Google Drive
- При изменении структуры файлов обновите соответствующие TypeScript интерфейсы
- Все изменения должны быть синхронизированы с Google Drive
