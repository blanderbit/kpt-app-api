<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**KPT App** - Прогрессивное NestJS приложение для управления пользователями, профилями и активностями.

### Основные возможности:
- 🔐 **Аутентификация**: JWT, Firebase OAuth (Google/Apple), email/password
- 👤 **Профили пользователей**: управление данными, смена темы, email, пароля
- 📊 **Активности**: рейтинговая активность с двумя параметрами (удовлетворенность + сложность = 100%)
- 😊 **Mood Tracker**: отслеживание настроения с 16 типами эмоций
- 🛡️ **Админ система**: консольные команды и веб-интерфейс
- 📧 **Email система**: HTML шаблоны для уведомлений
- 🐳 **Docker**: готовые конфигурации для staging и development
- 📚 **Swagger**: полная API документация

### Архитектура:
- **NestJS** - основной фреймворк
- **TypeORM** - ORM для работы с базой данных
- **MySQL** - основная база данных
- **JWT** - аутентификация и авторизация
- **Firebase Admin SDK** - OAuth аутентификация
- **Swagger** - API документация

## Project setup

```bash
$ npm install
```

## 🚀 Quick Start

### 1. Установка зависимостей
```bash
npm install
```

### 2. Создание первого администратора
```bash
npm run cli create-admin --email admin@example.com --password admin123
```

### 3. CLI команды
```bash
# Основные команды
npm run cli                    # Запуск CLI
npm run cli:build             # Сборка CLI

# Управление администраторами
npm run cli:create-admin -- --email admin@example.com --password password123
npm run cli:create-admin -- --email admin@example.com --password password123 --firstName "John"
npm run cli:remove-admin -- --email admin@example.com
npm run cli:list-admins

# Заполнение базы данных тестовыми данными
npm run cli seed-database
npm run cli seed-database -- --users 50 --admins 5
npm run cli seed-database -- --users 200 --admins 10 --skip-clean
```

#### Command descriptions:

**create-admin** - Create a new administrator
- `--email, -e <email>` - Administrator email (required)
- `--password, -p <password>` - Administrator password (required)
- `--firstName <firstName>` - Administrator first name (optional, default: "Admin")

**remove-admin** - Remove an administrator
- `--email, -e <email>` - Administrator email to remove (required)

**list-admins** - List all administrators
- No parameters, displays a list of all administrators with their data

**seed-database** - Populate the database with test data
- `--users <number>` - Number of regular users (default: 100)
- `--admins <number>` - Number of administrators (default: 10)
- `--skip-clean` - Do not truncate tables before seeding (by default tables are cleaned)

### 4. Запуск приложения
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

### 5. Docker (опционально)
```bash
# Development окружение
npm run docker:dev

# Staging окружение
npm run docker:stg

# С пересборкой
npm run docker:dev:build
npm run docker:stg:build

# Остановка
npm run docker:dev:down
npm run docker:stg:down

# Просмотр логов
npm run docker:dev:logs
npm run docker:stg:logs
```

### 6. Swagger документация
- **Development**: http://localhost:3000/api/docs
- **Staging**: http://localhost:3000/api/docs

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## 📚 Документация

- [🚀 Quick Start](docs/QUICK_START.md) - Быстрый старт
- [🛡️ Admin System](docs/ADMIN_README.md) - Система администрирования
- [📧 Email Templates](docs/EMAIL_TEMPLATES_README.md) - HTML шаблоны email
- [🐳 Docker Setup](docs/DOCKER_README.md) - Настройка Docker
- [🔥 Firebase Setup](docs/FIREBASE_SETUP.md) - Настройка Firebase OAuth
- [📋 API Endpoints](docs/API_ENDPOINTS.md) - Все API endpoints
- [📝 Changelog](docs/CHANGELOG.md) - История изменений
- [🎯 Activity Types System](docs/ACTIVITY_TYPES_README.md) - Система типов активностей с AI-определением

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
