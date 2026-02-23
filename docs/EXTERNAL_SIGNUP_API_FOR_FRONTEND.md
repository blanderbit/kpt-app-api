# External signup API — инструкция для фронтенда

Как использовать эндпоинты внешнего сценария: квиз → оплата Paddle → переход в приложение уже залогиненным (по токену) → онбординг в приложении.

---

## 1. Список эндпоинтов (кратко)

**Публичные (без авторизации):**

| Эндпоинт | Что делает |
|----------|------------|
| **GET /public/programs** | Возвращает список всех программ (id, name и др.). Нужен, чтобы показать пользователю выбор программы или подставить в UI. |
| **POST /public/select-program** | Принимает ответы квиза (`quiz`), возвращает подобранную программу `{ program: { id, name } }`. Можно использовать для «рекомендованной» программы по квизу. |
| **POST /public/external/start-signup** | Старт сценария: принимает email, quiz, programId (и опционально programName). Создаёт запись «ожидающая оплата», возвращает `app_user_id` для чекаута Paddle. |
| **GET /public/external/signup-result?app_user_id=...** | После успешной оплаты возвращает `registrationLink`, `accessToken`, `refreshToken`. Вызывать один раз после оплаты (при 404 — повторить через 2–3 сек: бэк создаёт пользователя по вебхуку Paddle→RevenueCat, он может прийти с задержкой). В этот же момент на email пользователя бэкенд отправляет письмо с **временным паролем** (для входа по email/пароль при необходимости; пароль можно сменить в настройках). |

**С авторизацией (JWT, после входа в приложение):**

| Эндпоинт | Что делает |
|----------|------------|
| **POST /profile/generate-summary** | Генерирует summary по ответам квиза пользователя (ChatGPT) и сохраняет в профиль. Нужен, если хотите показать персональный summary на онбординге. |
| **PUT /profile/needs-onboarding** | Тело `{ "needsOnboarding": true \| false }`. Обновляет флаг «нужен ли онбординг». Вызвать с `false`, когда пользователь завершил онбординг. |
| **POST /profile/suggested-activities/generate-from-quiz** | Тело: `hardness`, `satisfaction` (0–100), `suggestedActivityCount` (1–20). Генерирует suggested activities по квизу, программе и опционально summary пользователя. |
| **POST /profile/suggested-activities/add-all-to-activities** | Переносит все suggested activities пользователя в обычные активности (список «мои активности»). Вызывать после того, как пользователь «принял» предложенные активности. |

---

## 2. Общая схема флоу

```
[Квиз на стороннем сайте]
       ↓
[Получить программу: GET /public/programs или POST /public/select-program]
       ↓
[POST /public/external/start-signup] → app_user_id
       ↓
[Чекаут Paddle с app_user_id в metadata]
       ↓
[Пользователь платит]
       ↓
[GET /public/external/signup-result?app_user_id=...] → registrationLink + accessToken + refreshToken
       ↓
[Редирект в приложение с токеном] → пользователь залогинен
       ↓
[В приложении: онбординг — при необходимости POST /profile/generate-summary, POST /profile/suggested-activities/generate-from-quiz, POST /profile/suggested-activities/add-all-to-activities, PUT /profile/needs-onboarding с телом { "needsOnboarding": false }]
```

**Важно:** Вебхук (Paddle → RevenueCat → бэкенд) вызывается **не с фронта**. Фронт только вызывает start-signup, открывает чекаут с `app_user_id`, после оплаты — signup-result.

---

## 3. GET /public/programs — список программ

**Назначение:** Получить полный список программ. Используйте, чтобы показать пользователю выбор программы на странице квиза (выпадающий список, карточки и т.п.) или для отображения названия выбранной программы.

**Метод и путь:** `GET /public/programs`

**Авторизация:** не требуется.

**Ответ при успехе (200):** массив программ (или объект с полем `programs` — зависит от формата ответа бэкенда). У каждой программы есть как минимум `id` (число) и `name` (строка). Эти значения потом передаются в start-signup как `programId` и `programName`.

**Что делать дальше:** Сохранить список в состоянии; при выборе пользователем (или после select-program) взять `id` и `name` выбранной программы и передать их в **POST /public/external/start-signup**.

---

## 4. POST /public/select-program — подбор программы по квизу

**Назначение:** По ответам пользователя в квизе получить одну подобранную программу (AI). Можно показать пользователю «Вам подходит программа: …» и использовать её в start-signup без ручного выбора из списка.

**Метод и путь:** `POST /public/select-program`

**Авторизация:** не требуется.

**Тело запроса (JSON):**

| Поле  | Тип   | Обязательное | Описание |
|-------|-------|--------------|----------|
| `quiz` | массив | да | Пары вопрос–ответ. Каждый элемент: `{ "questionText": string, "answerText": string }`. |

**Пример тела:**

```json
{
  "quiz": [
    { "questionText": "What would you most like to improve?", "answerText": "My stress levels" },
    { "questionText": "How would you describe your sleep?", "answerText": "I have trouble falling asleep" }
  ]
}
```

**Ответ при успехе (200):** объект с полем `program`, например `{ "program": { "id": 1, "name": "Stress and Anxiety Management" } }`.

**Что делать дальше:** Использовать `program.id` и `program.name` в теле **POST /public/external/start-signup** как `programId` и `programName`. Тот же массив `quiz` передаётся в start-signup в поле `quiz`.

---

## 5. POST /public/external/start-signup — старт сценария (до оплаты)

**Назначение:** Зарегистрировать «слот» под будущего пользователя (email + программа + квиз) и получить идентификатор для чекаута Paddle и для последующего запроса результата. Вызывается **до** открытия чекаута.

**Метод и путь:** `POST /public/external/start-signup`

**Авторизация:** не требуется.

**Тело запроса (JSON):**

| Поле         | Тип    | Обязательное | Описание |
|--------------|--------|--------------|----------|
| `quiz`       | массив | да           | Пары вопрос–ответ из квиза. Каждый элемент: `{ "questionText": string, "answerText": string }`. |
| `email`      | string | да           | Email пользователя (валидный формат). |
| `programId`  | number | да           | Id программы (из ответа `POST /public/select-program` или из выбора по списку `GET /public/programs`). Число ≥ 1. |
| `programName`| string | нет          | Название программы (удобно для отображения и для бэкенда). |

**Пример тела:**

```json
{
  "quiz": [
    { "questionText": "What would you most like to improve?", "answerText": "My stress levels" },
    { "questionText": "How would you describe your sleep?", "answerText": "I have trouble falling asleep" }
  ],
  "email": "user@example.com",
  "programId": 1,
  "programName": "Stress and Anxiety Management"
}
```

**Ответ при успехе (201):**

```json
{
  "appUserId": "web_signup_a1b2c3d4e5f6..."
}
```

Опционально в ответе может быть поле `checkoutUrl` (если бэкенд сам создаёт чекаут через Paddle API). Сейчас возвращается только `appUserId`.

**Ошибки:**

| Код | Когда |
|-----|--------|
| **409** | Email уже зарегистрирован в приложении — «This email is already registered. Please log in to the app.» |
| **409** | У этого email уже есть незавершённая оплата — «You already have a pending payment. Complete the payment or wait for the link to expire.» |
| **400** | Ошибка валидации (неверный email, пустой quiz и т.д.). |

**Что делать дальше:** Сохранить `app_user_id` и передать его в чекаут Paddle (см. раздел 6). На страницу успешной оплаты переходить с этим же `app_user_id` в URL (например `https://yoursite.com/success?app_user_id=web_signup_...`), чтобы потом вызвать signup-result.

---

## 6. Чекаут Paddle и app_user_id

Оплата происходит в Paddle. Чтобы после оплаты бэкенд мог сопоставить платёж с записью и создать пользователя, в чекаут **обязательно** нужно передать тот же **app_user_id**, что вернул start-signup.

- В Paddle при создании транзакции/чекаута в **custom_data** (или в том поле, которое настроено в RevenueCat как «App User ID») передайте:  
  `app_user_id: "<значение из ответа start-signup>"`.
- RevenueCat по этому полю привяжет покупку к «пользователю» и отправит вебхук на бэкенд с тем же `app_user_id`. По нему будет найдена запись и создан пользователь.

Как именно открывать чекаут (ссылкой RevenueCat Web Purchase Links с подставленным app_user_id или своим вызовом Paddle API) — зависит от вашей интеграции с Paddle/RevenueCat. Главное: **app_user_id из start-signup должен попасть в Paddle (metadata/custom_data)**.

---

## 7. Как узнать, что оплата прошла

После успешной оплаты пользователь либо попадает на вашу страницу, либо вы получаете событие в коде. Два типичных варианта:

- **Вариант A (success URL):** При открытии чекаута задаёте `successUrl`, например  
  `https://yoursite.com/success?app_user_id=XXX`  
  (подставьте реальный `app_user_id`). После оплаты Paddle редиректит на этот URL. На странице `/success` читаете `app_user_id` из query и вызываете signup-result.

- **Вариант B (Paddle.js):** В `Paddle.Initialize()` передаёте `eventCallback`. При успешной оплате приходит событие `checkout.completed`. В этот момент вызываете signup-result, передавая тот же `app_user_id`, что использовали при открытии чекаута (его нужно хранить в состоянии/сессии).

Итого: в обоих случаях у вас есть **app_user_id** — по нему один раз запрашиваете signup-result.

---

## 8. GET /public/external/signup-result — результат после оплаты

**Назначение:** После успешной оплаты получить ссылку на приложение и токены авторизации, чтобы пользователь открыл приложение уже залогиненным.

**Метод и путь:** `GET /public/external/signup-result?app_user_id=<app_user_id>`

**Авторизация:** не требуется.

**Query-параметр:**

| Параметр      | Обязательный | Описание |
|---------------|--------------|----------|
| `app_user_id` | да           | То же значение, что вернул start-signup (например `web_signup_a1b2c3d4e5f6...`). |

**Ответ при успехе (200):**

```json
{
  "registrationLink": "https://app.plesury.com/onboarding",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

- **registrationLink** — URL, по которому открывать приложение (или показывать «Перейти в приложение»).
- **accessToken**, **refreshToken** — JWT для авторизации в приложении. Передать их в приложение (через deep link, postMessage или при открытии по ссылке с параметрами), чтобы пользователь оказался сразу залогиненным без ввода пароля.

**Письмо с временным паролем:** В момент создания пользователя (после успешной оплаты) бэкенд генерирует временный пароль, сохраняет его в профиле и отправляет на email пользователя письмо с этим паролем. Пользователь может войти в приложение по email + пароль (например, если токены не передались или для входа с другого устройства); пароль рекомендуется сменить в настройках после первого входа.

**Ошибки:**

| Код | Когда |
|-----|--------|
| **400** | Не передан `app_user_id`. |
| **404** | Запись не найдена или оплата ещё не обработана на бэкенде. |

**Важно про 404:** Сразу после редиректа с Paddle бэкенд мог ещё не успеть получить вебхук от RevenueCat и создать пользователя. В этом случае signup-result вернёт 404. Рекомендуется: при 404 повторить запрос через 2–3 секунды (один-два раза).

---

## 9. Эндпоинты после входа в приложение (JWT)

Все запросы ниже выполняются **с заголовком авторизации** `Authorization: Bearer <accessToken>` (токен из signup-result). Пользователь уже определён по токену.

---

### 9.1. POST /profile/generate-summary — сгенерировать summary по квизу

**Назначение:** Сгенерировать персональный текст (summary) по ответам пользователя в квизе (ChatGPT) и сохранить его в профиль. У пользователя должен быть заполнен `quizSnapshot` (он заполняется при оплате из external signup). Вызывать при необходимости на онбординге, если нужно показать пользователю этот текст.

**Метод и путь:** `POST /profile/generate-summary`

**Тело запроса:** не требуется.

**Ответ при успехе (200):** `{ "summary": "..." }` — сгенерированный и сохранённый текст.

**Ошибки:**

| Код | Когда |
|-----|--------|
| **400** | Нет данных квиза у пользователя («No quiz data to generate summary»). |

---

### 9.2. PUT /profile/needs-onboarding — обновить флаг онбординга

**Назначение:** Обновить у текущего пользователя флаг «нужен ли онбординг». Вызвать с `false`, когда пользователь завершил онбординг в приложении.

**Метод и путь:** `PUT /profile/needs-onboarding`

**Тело запроса (JSON):**

| Поле              | Тип     | Описание |
|-------------------|--------|----------|
| `needsOnboarding` | boolean| `true` или `false`. |

**Пример:** `{ "needsOnboarding": false }`

**Ответ при успехе (200):** `{ "needsOnboarding": false }` (или переданное значение).

---

### 9.3. POST /profile/suggested-activities/generate-from-quiz — сгенерировать suggested activities

**Назначение:** Сгенерировать для пользователя список suggested activities (рекомендованных активностей) на основе его квиза, программы, опционально summary и переданных hardness/satisfaction. Результат сохраняется в списке suggested activities пользователя. У пользователя должны быть заполнены quizSnapshot и выбранная программа (приходят из external signup).

**Метод и путь:** `POST /profile/suggested-activities/generate-from-quiz`

**Тело запроса (JSON):**

| Поле                    | Тип    | Описание |
|-------------------------|--------|----------|
| `hardness`              | number | Целое 0–100 (уровень сложности). |
| `satisfaction`          | number | Целое 0–100 (уровень удовлетворённости). |
| `suggestedActivityCount` | number | Целое 1–20. Сколько активностей сгенерировать. |

**Пример:** `{ "hardness": 50, "satisfaction": 70, "suggestedActivityCount": 5 }`

**Ответ при успехе (201):** массив созданных suggested activities (id, activityName, activityType, content, reasoning и т.д.).

**Ошибки:**

| Код | Когда |
|-----|--------|
| **400** | Нет данных квиза или программы у пользователя; или неверный формат/диапазон полей (например hardness не 0–100). |

---

### 9.4. POST /profile/suggested-activities/add-all-to-activities — перенести все suggested в обычные активности

**Назначение:** Все suggested activities текущего пользователя превратить в обычные «активности» (список активностей пользователя) и удалить из suggested. Вызывать, когда пользователь «принял» все предложенные активности (например на шаге онбординга).

**Метод и путь:** `POST /profile/suggested-activities/add-all-to-activities`

**Тело запроса:** не требуется.

**Ответ при успехе (201):** `{ "message": "...", "activities": [ ... ] }` — сообщение и массив созданных активностей. Если suggested не было: `{ "message": "No suggested activities to transfer", "activities": [] }`.

---

## 10. Вебхук (для справки)

Вебхук **не вызывается с фронта**. Цепочка:

1. Пользователь платит в Paddle.
2. Paddle отправляет событие в **RevenueCat**.
3. RevenueCat отправляет вебхук на бэкенд (`POST /subscriptions/revenuecat/webhook`).
4. Бэкенд по `app_user_id` из вебхука находит запись external signup, создаёт пользователя, привязывает подписку.

Фронту нужно только в нужный момент вызвать **signup-result** с тем же `app_user_id`. При 404 — подождать и повторить.

---

## 11. Краткий чеклист для фронта

**На стороннем сайте (до оплаты):**

1. Показать квиз; при необходимости получить список программ (**GET /public/programs**) или подобранную программу (**POST /public/select-program** с ответами квиза).
2. Вызвать **POST /public/external/start-signup** (quiz, email, programId, при необходимости programName).
3. Сохранить **app_user_id** из ответа.
4. Открыть чекаут Paddle, передав **app_user_id** в custom_data/metadata (как настроено в RevenueCat).
5. После успешной оплаты вызвать **GET /public/external/signup-result?app_user_id=...** (при 404 — повторить через 2–3 сек: вебхук создаёт пользователя с задержкой).
6. Взять из ответа **registrationLink**, **accessToken**, **refreshToken**; передать токены в приложение и/или редирект по **registrationLink**.

**В приложении (после входа по токену):**

7. При необходимости: **POST /profile/generate-summary** (если нужен summary на онбординге).
8. При необходимости: **POST /profile/suggested-activities/generate-from-quiz** (hardness, satisfaction, suggestedActivityCount).
9. Когда пользователь «принял» предложенные активности: **POST /profile/suggested-activities/add-all-to-activities**.
10. Когда онбординг завершён: **PUT /profile/needs-onboarding** с телом `{ "needsOnboarding": false }`.

Если нужны примеры запросов (fetch/axios) или уточнение полей под вашу интеграцию Paddle/RevenueCat — можно добавить отдельным приложением.
