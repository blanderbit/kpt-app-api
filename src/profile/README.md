# 👤 Profile Module

Основной модуль профиля пользователя с подмодулями для управления активностями, настроением и аналитикой.

## 📁 Структура

```
src/profile/
├── profile.module.ts              # Основной модуль Profile
├── profile.controller.ts           # Контроллер профиля пользователя
├── profile.service.ts              # Сервис профиля
├── dto/                            # DTO для профиля
│   └── profile.dto.ts              # DTO профиля пользователя
├── activity/                       # 🎯 Модуль активностей
│   ├── README.md                   # Документация Activity модуля
│   ├── activity.module.ts          # Модуль Activity
│   ├── activity.controller.ts      # Контроллер активностей
│   ├── activity.service.ts         # Сервис активностей
│   ├── activity-types.service.ts   # Сервис типов активностей
│   ├── activity.config.ts          # Конфигурация пагинации
│   ├── entities/                   # Сущности активностей
│   │   ├── activity.entity.ts      # Сущность Activity
│   │   └── rate-activity.entity.ts # Сущность RateActivity
│   └── dto/                        # DTO активностей
│       ├── activity.dto.ts         # DTO для активностей
│       └── rate-activity.dto.ts    # DTO для рейтинговых активностей
├── mood-tracker/                   # 😊 Модуль отслеживания настроения
│   ├── README.md                   # Документация MoodTracker модуля
│   ├── mood-tracker.module.ts      # Модуль MoodTracker
│   ├── mood-tracker.controller.ts  # Контроллер настроения
│   ├── mood-tracker.service.ts     # Сервис настроения
│   ├── mood-types.service.ts       # Сервис типов настроения
│   ├── entities/                   # Сущности настроения
│   │   └── mood-tracker.entity.ts  # Сущность MoodTracker
│   └── dto/                        # DTO настроения
│       └── mood-tracker.dto.ts     # DTO для настроения
└── analytics/                      # 📊 Модуль аналитики
    ├── README.md                   # Документация Analytics модуля
    ├── analytics.module.ts         # Модуль Analytics
    ├── analytics.controller.ts     # Контроллер аналитики
    ├── analytics.service.ts        # Сервис аналитики
    └── dto/                        # DTO аналитики
```

## 🚀 Функциональность

### Основные возможности
- **Управление профилем** - личная информация, настройки
- **Активности** - создание, управление, отслеживание задач
- **Отслеживание настроения** - ежедневные записи настроения
- **Аналитика продуктивности** - статистика и метрики
- **Интеграция** - связь между всеми компонентами

### Подмодули

#### 🎯 Activity Module
- **CRUD операции** с активностями
- **AI-определение типа** активности
- **Система статусов** - active/closed
- **Рейтинговые активности** - satisfactionLevel и hardnessLevel
- **Пагинация и фильтрация** с nestjs-paginate

#### 😊 MoodTracker Module
- **Отслеживание настроения** - один раз в день
- **16 типов настроения** - от очень плохого до отличного
- **История настроения** - за последние 7 дней
- **Валидация** - предотвращение дублирования записей

#### 📊 Analytics Module
- **Анализ продуктивности** - количество выполненных задач
- **Статистика по дням** - дни с выполненными задачами
- **Рейтинговые метрики** - satisfactionLevel и hardnessLevel
- **Рекомендации** - на основе статистики

## 🏗️ Архитектура

### ProfileModule
Основной модуль, который импортирует все подмодули:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
    ActivityModule,
    MoodTrackerModule,
    AnalyticsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService, ActivityModule, MoodTrackerModule, AnalyticsModule],
})
export class ProfileModule {}
```

### Зависимости
- **TypeOrmModule** - для работы с базой данных
- **EmailModule** - для отправки уведомлений
- **ActivityModule** - для управления активностями
- **MoodTrackerModule** - для отслеживания настроения
- **AnalyticsModule** - для аналитики продуктивности

## 🔧 API Endpoints

### Профиль пользователя
- `GET /profile` - получить профиль
- `PUT /profile` - обновить профиль
- `POST /profile/change-email` - запрос на смену email
- `POST /profile/confirm-email-change` - подтверждение смены email
- `POST /profile/change-password` - смена пароля
- `POST /profile/change-theme` - смена темы приложения
- `DELETE /profile` - удаление аккаунта
- `POST /profile/logout` - выход из системы

### Активности
- `GET /profile/activities` - список активностей
- `POST /profile/activities` - создать активность
- `GET /profile/activities/:id` - получить активность
- `PUT /profile/activities/:id` - обновить активность
- `DELETE /profile/activities/:id` - удалить активность
- `POST /profile/activities/:id/close` - закрыть активность

### Настроение
- `POST /profile/mood-tracker` - установить настроение
- `GET /profile/mood-tracker/current` - текущее настроение
- `GET /profile/mood-tracker/last-7-days` - история настроения
- `PUT /profile/mood-tracker/:date` - обновить настроение
- `DELETE /profile/mood-tracker/:date` - удалить настроение

### Аналитика
- `GET /profile/analytics/completed-tasks-days` - дни с задачами
- `GET /profile/analytics/completed-tasks-count` - количество задач
- `GET /profile/analytics/rate-activity-stats` - статистика рейтингов

## 🔐 Безопасность

### Авторизация
- **JwtAuthGuard** - проверка JWT токена для всех endpoints
- **CurrentUser** - получение текущего пользователя
- **Изоляция данных** - пользователи видят только свои данные

### Валидация
- **DTO валидация** - проверка входных данных
- **Бизнес-правила** - проверка статуса и состояния
- **Ограничения** - satisfactionLevel + hardnessLevel = 100%

### Email подтверждения
- **Смена email** - подтверждение через email
- **Токены** - безопасные токены для подтверждения
- **Временные данные** - хранение до подтверждения

## 📝 DTO

### Profile DTO
```typescript
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  theme?: 'light' | 'dark' | 'auto';
}
```

### Email Change DTO
```typescript
export class ChangeEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  password: string;
}
```

### Password Change DTO
```typescript
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

## 🧪 Тестирование

### Unit тесты
- **ProfileService** - бизнес-логика профиля
- **ActivityService** - управление активностями
- **MoodTrackerService** - отслеживание настроения
- **AnalyticsService** - аналитика продуктивности

### Integration тесты
- **API endpoints** - полный цикл запросов
- **База данных** - CRUD операции
- **Email сервис** - отправка уведомлений

### E2E тесты
- **Пользовательские сценарии** - полный жизненный цикл
- **Валидация** - обработка ошибок
- **Производительность** - большие объемы данных

## 🔍 Мониторинг

### Логирование
- **Изменения профиля** - для аудита
- **Создание активностей** - для аналитики
- **Отслеживание настроения** - для психологического анализа
- **Ошибки валидации** - для отладки

### Метрики
- **Количество пользователей** - активных, новых
- **Популярные активности** - по типам и категориям
- **Тренды настроения** - изменение во времени
- **Продуктивность** - средние показатели

## 🚀 Развитие

### Планируемые улучшения
- **Машинное обучение** - предсказание продуктивности и настроения
- **Персонализация** - индивидуальные рекомендации
- **Интеграции** - с внешними сервисами
- **Уведомления** - умные напоминания

### API версионирование
- **v1** - текущая версия
- **v2** - расширенные возможности
- **Backward compatibility** - поддержка старых версий

### Масштабирование
- **Микросервисы** - разделение на отдельные сервисы
- **Кэширование** - Redis для часто запрашиваемых данных
- **База данных** - шардинг и репликация

## 🔗 Интеграции

### Внутренние модули
- **Users** - для управления пользователями
- **Auth** - для аутентификации и авторизации
- **Email** - для уведомлений
- **Firebase** - для OAuth

### Внешние сервисы
- **AI сервисы** - для определения типов активностей
- **Аналитика** - для глубокого анализа данных
- **Уведомления** - для push уведомлений

## 📚 Документация

### Подмодули
- **[Activity Module](activity/README.md)** - подробная документация по активностям
- **[MoodTracker Module](mood-tracker/README.md)** - документация по отслеживанию настроения
- **[Analytics Module](analytics/README.md)** - документация по аналитике

### Общие ресурсы
- **[API Endpoints](../docs/API_ENDPOINTS.md)** - все API endpoints
- **[Database Schema](../mysql/init/01-init.sql)** - схема базы данных
- **[Changelog](../docs/CHANGELOG.md)** - история изменений

---

**Важно:** Модуль требует настроенной базы данных, EmailModule и всех зависимостей.
