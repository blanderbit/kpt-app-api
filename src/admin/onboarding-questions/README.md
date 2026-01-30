# 🚀 Onboarding Questions Module

Public API module for managing onboarding questions and steps.

## 📁 Structure

```
src/admin/onboarding-questions/
├── onboarding-questions.controller.ts      # Public API controller
├── onboarding-questions-admin.service.ts   # Admin service
├── onboarding-questions.module.ts          # Module configuration
├── index.ts                                # Module exports
└── README.md                               # Module documentation
```

## 🚀 Features

- **Public API**: No authentication required
- **Google Drive Integration**: Loads data from Google Drive
- **Caching**: In-memory caching for performance
- **Step Filtering**: Filter by required/optional steps
- **Statistics**: Get statistical information about onboarding questions

## 🔧 API Endpoints

### Public Endpoints

#### GET `/onboarding-questions`
Get all available onboarding questions and steps.

**Query Parameters:**
- `lang` (optional): Language code for localized texts (e.g. `en`, `ru`, `uk`). Fallback order: requested language → `en` → empty string. If omitted, defaults to `en`.

**Response:**
```json
[
  {
    "stepName": "improvement_goal",
    "stepQuestion": "What's the #1 thing you'd love to improve with KPT?",
    "answers": [
      {
        "id": "more_energy",
        "text": "More energy",
        "subtitle": "Boost your daily vitality and feel more energized",
        "icon": "<svg>...</svg>"
      }
    ],
    "inputType": "single",
    "required": true
  }
]
```

#### GET `/onboarding-questions/by-step?stepName=improvement_goal`
Get a specific onboarding step by step name.

**Query Parameters:**
- `stepName` (required): Step name identifier
- `lang` (optional): Language code for localized texts (same fallback as above)

#### GET `/onboarding-questions/required`
Get only the required onboarding steps.

**Response:**
```json
[
  {
    "stepName": "improvement_goal",
    "stepQuestion": "What's the #1 thing you'd love to improve with KPT?",
    "answers": [...],
    "inputType": "single",
    "required": true
  }
]
```

#### GET `/onboarding-questions/optional`
Get only the optional onboarding steps. Supports optional `lang` query parameter for localization.

#### GET `/onboarding-questions/stats`
Get statistical information about onboarding questions.

**Response:**
```json
{
  "totalSteps": 6,
  "totalAnswers": 24,
  "averageAnswersPerStep": 4,
  "requiredSteps": 6,
  "optionalSteps": 0
}
```

## 🌐 Localization

All GET endpoints that return onboarding steps accept an optional query parameter **`lang`** (e.g. `?lang=ru`). The backend resolves translation keys from the onboarding file using the language cache (from `LANGUAGES_FOLDER_ID`). **Fallback:** requested language → `en` → empty string. The onboarding file in Drive stores keys (e.g. `onboarding_questions.improvement_goal.step_question`); actual strings come from the language JSON files (en, ru, uk, etc.).

## 📊 Data Structure

Onboarding questions are stored as JSON in Google Drive. Text fields (`stepQuestion`, `text`, `subtitle`) contain **translation keys**; the structure is:

```json
{
  "onboardingSteps": [
    {
      "stepName": "improvement_goal",
      "stepQuestion": "onboarding_questions.improvement_goal.step_question",
      "answers": [
        {
          "id": "more_energy",
          "text": "onboarding_questions.improvement_goal.answers.more_energy.text",
          "subtitle": "onboarding_questions.improvement_goal.answers.more_energy.subtitle",
          "icon": "<svg>...</svg>"
        }
      ],
      "inputType": "single",
      "required": true
    }
  ]
}
```
Translations for these keys live in the language JSON files (e.g. `en.json`, `ru.json`) under the `onboarding_questions` block.

## 🔧 Configuration

The service requires the following environment variable:
- `ONBOARDING_QUESTIONS_FILE_ID` - Google Drive file ID containing onboarding questions data

## 🚀 Usage

The module is automatically available in the admin module and provides public endpoints for accessing onboarding questions data.

## 📝 Notes

- This is a **public API** - no authentication required
- Data is loaded from Google Drive on startup
- Fallback data is provided if Google Drive is unavailable
- SVG icons are included for UI display
- Supports both single and multiple choice questions
- Steps can be marked as required or optional
