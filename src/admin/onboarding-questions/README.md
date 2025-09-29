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
Get only the optional onboarding steps.

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

## 📊 Data Structure

Onboarding questions are stored as JSON in Google Drive with the following structure:

```json
{
  "onboardingSteps": [
    {
      "stepName": "improvement_goal",
      "stepQuestion": "What's the #1 thing you'd love to improve with KPT?",
      "answers": [
        {
          "id": "more_energy",
          "text": "More energy",
          "subtitle": "Boost your daily vitality and feel more energized",
          "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"#FFD700\"><path d=\"M7 2v11h3v9l7-12h-4l4-8z\"/></svg>"
        }
      ],
      "inputType": "single",
      "required": true
    }
  ]
}
```

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
