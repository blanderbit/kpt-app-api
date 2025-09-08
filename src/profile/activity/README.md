# 🎯 Activity Module

Модуль для управления активностями пользователей с AI-определением типов.

## 📁 Структура

```
src/profile/activity/
├── activity.module.ts                    # Модуль Activity
├── activity.controller.ts                 # Контроллер для API endpoints
├── activity.service.ts                    # Бизнес-логика активностей
├── activity-types.service.ts              # Сервис для работы с типами активностей
├── activity.config.ts                     # Конфигурация пагинации

├── entities/                              # Сущности базы данных
│   ├── activity.entity.ts                 # Сущность Activity
│   └── rate-activity.entity.ts            # Сущность RateActivity
└── dto/                                   # Data Transfer Objects
    ├── activity.dto.ts                    # DTO для активностей
    └── rate-activity.dto.ts               # DTO для рейтинговых активностей
```

## 🚀 Функциональность

### Основные возможности
- **CRUD операции** с активностями
- **AI-определение типа** активности на основе названия и контента
- **Система статусов** - active/closed
- **Рейтинговые активности** - satisfactionLevel и hardnessLevel
- **Пагинация и фильтрация** с nestjs-paginate
- **Поиск и сортировка** активностей

### API Endpoints

#### Получение активностей
- `GET /profile/activities` - список активностей с пагинацией
- `GET /profile/activities/:id` - активность по ID

#### Управление активностями
- `POST /profile/activities` - создать активность
- `PUT /profile/activities/:id` - обновить активность
- `DELETE /profile/activities/:id` - удалить активность

#### Закрытие активностей
- `POST /profile/activities/:id/close` - закрыть активность с рейтингом

#### Типы активностей
- `GET /profile/activities/types/all` - все типы активностей
- `GET /profile/activities/types/recommended` - рекомендуемые типы
- `GET /profile/activities/types/category/:category` - типы по категории
- `GET /profile/activities/types/search` - поиск типов



## 🏗️ Архитектура

### Activity Entity
```typescript
@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activityName: string;

  @Column()
  activityType: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: 'active' })
  status: 'active' | 'closed';

  @Column({ nullable: true })
  closedAt: Date;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RateActivity, rateActivity => rateActivity.activity)
  rateActivities: RateActivity[];
}
```

### RateActivity Entity
```typescript
@Entity('rate_activities')
export class RateActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activityId: number;

  @Column('int')
  satisfactionLevel: number;

  @Column('int')
  hardnessLevel: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Activity, activity => activity.rateActivities)
  activity: Activity;
}
```



## 🔧 Конфигурация

### Пагинация (nestjs-paginate)
```typescript
export const ACTIVITY_PAGINATION_CONFIG: PaginateConfig<Activity> = {
  sortableColumns: [
    'id', 'activityName', 'activityType', 'isPublic', 'status', 'createdAt', 'updatedAt', 'closedAt',
  ],
  defaultSortBy: [['createdAt', 'DESC']],
  searchableColumns: [
    'activityName', 'activityType',
  ],
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.LT, FilterOperator.GTE, FilterOperator.LTE],
    activityName: [FilterOperator.EQ, FilterOperator.ILIKE, FilterOperator.SW, FilterOperator.CONTAINS],
    activityType: [FilterOperator.EQ, FilterOperator.IN, FilterOperator.ILIKE, FilterOperator.CONTAINS],
    isPublic: [FilterOperator.EQ],
    status: [FilterOperator.EQ, FilterOperator.IN],
    userId: [FilterOperator.EQ],
    createdAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    updatedAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    closedAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT, FilterOperator.NULL, FilterOperator.NOT],
  },
  select: [
    'id', 'activityName', 'activityType', 'content', 'isPublic', 'status', 'closedAt', 'createdAt', 'updatedAt', 'userId',
  ],
  defaultLimit: 20,
  maxLimit: 100,
  relations: ['rateActivities'],
  nullSort: 'last',
};
```

## 🧠 AI-определение типа

### ActivityTypesService
Сервис автоматически определяет тип активности на основе:
- **Названия активности** - ключевые слова
- **Контента** - описание и детали
- **JSON-конфигурации** - предопределенные типы

### Типы активностей
- **health** - здоровье и спорт
- **work** - работа и карьера
- **learning** - обучение и развитие
- **hobby** - хобби и развлечения
- **social** - социальная активность
- **finance** - финансы и планирование
- **home** - дом и быт
- **travel** - путешествия
- **creativity** - творчество
- **mindfulness** - осознанность
- **technology** - технологии
- **nature** - природа и экология
- **other** - прочее

## 📊 Бизнес-логика

### Создание активности
1. Валидация входных данных
2. AI-определение типа активности
3. Создание записи в базе данных
4. Возврат DTO ответа

### Закрытие активности
1. Проверка существования активности
2. Валидация статуса (не должна быть закрыта)
3. Создание RateActivity с рейтингом
4. Обновление статуса на 'closed'
5. Установка closedAt

### Обновление активности
1. Проверка существования и принадлежности
2. Валидация статуса (закрытые нельзя изменять)
3. Обновление разрешенных полей
4. Сохранение изменений



## 🔐 Безопасность

### Авторизация
- **JwtAuthGuard** - проверка JWT токена
- **CurrentUser** - получение текущего пользователя
- **Проверка принадлежности** - пользователь может управлять только своими активностями

### Валидация
- **DTO валидация** - проверка входных данных
- **Бизнес-правила** - проверка статуса и состояния
- **Ограничения** - satisfactionLevel + hardnessLevel = 100%

## 📝 DTO

### CreateActivityDto
```typescript
export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  activityName: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
```

### CreateRateActivityDto
```typescript
export class CreateRateActivityDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  satisfactionLevel: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  hardnessLevel: number;

  @ValidateIf((o) => o.satisfactionLevel !== undefined || o.hardnessLevel !== undefined)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Validate((value, args) => {
    const obj = args.object as CreateRateActivityDto;
    return (obj.satisfactionLevel + obj.hardnessLevel) === 100;
  }, { message: 'satisfactionLevel + hardnessLevel должно равняться 100' })
  totalLevel: number;
}
```




## 🧪 Тестирование

### Unit тесты
- **ActivityService** - бизнес-логика
- **ActivityTypesService** - AI-определение типов
- **DTO валидация** - проверка входных данных

### Integration тесты
- **API endpoints** - полный цикл запросов
- **База данных** - CRUD операции
- **Пагинация** - фильтрация и сортировка

### E2E тесты
- **Пользовательские сценарии** - создание, редактирование, закрытие
- **Валидация** - обработка ошибок
- **Производительность** - большие объемы данных

## 🔍 Мониторинг

### Логирование
- **Создание активностей** - для аналитики
- **Закрытие активностей** - для отслеживания прогресса
- **Ошибки валидации** - для отладки

### Метрики
- **Количество активностей** - по типам и статусам
- **Время выполнения** - CRUD операций
- **Популярные типы** - для улучшения AI
- **Статистика по типам** - распределение активностей

## 🚀 Развитие

### Планируемые улучшения
- **Машинное обучение** - улучшение определения типов активностей
- **AI-алгоритмы** - более умное определение категорий
- **Интеграции** - с внешними сервисами
- **Уведомления** - напоминания о задачах

### API версионирование
- **v1** - текущая версия
- **v2** - расширенные возможности
- **Backward compatibility** - поддержка старых версий

---

**Важно:** Модуль требует настроенной базы данных и конфигурации TypeORM.

---

**Важно:** Модуль SuggestedActivity теперь вынесен в отдельный модуль `src/suggested-activity/`.
