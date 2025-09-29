# 🌐 Social Networks Module

Public API module for managing social networks data.

## 📁 Structure

```
src/admin/social-networks/
├── social-networks.controller.ts      # Public API controller
├── social-networks-admin.service.ts   # Admin service
├── social-networks.module.ts          # Module configuration
├── index.ts                           # Module exports
└── README.md                          # Module documentation
```

## 🚀 Features

- **Public API**: No authentication required
- **Google Drive Integration**: Loads data from Google Drive
- **Caching**: In-memory caching for performance
- **Category Filtering**: Filter social networks by category
- **Statistics**: Get statistical information about social networks

## 🔧 API Endpoints

### Public Endpoints

#### GET `/social-networks`
Get all available social networks.

**Response:**
```json
[
  {
    "id": "facebook",
    "name": "Facebook",
    "description": "Connect with friends and family...",
    "svg": "<svg>...</svg>",
    "color": "#1877F2",
    "category": "social"
  }
]
```

#### GET `/social-networks/by-category?category=social`
Get social networks filtered by category.

**Query Parameters:**
- `category` (required): Category to filter by

#### GET `/social-networks/categories`
Get all available social network categories.

**Response:**
```json
{
  "social": "Social Networks",
  "professional": "Professional Networks",
  "messaging": "Messaging Platforms"
}
```

#### GET `/social-networks/stats`
Get statistical information about social networks.

**Response:**
```json
{
  "totalCount": 10,
  "categoryCounts": {
    "social": 8,
    "professional": 2
  },
  "categories": ["social", "professional", "messaging"]
}
```

#### GET `/social-networks/:id`
Get a specific social network by ID.

**Path Parameters:**
- `id`: Social network identifier

## 📊 Data Structure

Social networks are stored as JSON in Google Drive with the following structure:

```json
{
  "socialNetworks": [
    {
      "id": "facebook",
      "name": "Facebook",
      "description": "Connect with friends and family, share photos and videos, and discover new content.",
      "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
      "color": "#1877F2",
      "category": "social"
    }
  ],
  "categories": {
    "social": "Social Networks",
    "professional": "Professional Networks",
    "messaging": "Messaging Platforms"
  }
}
```

## 🔧 Configuration

The service requires the following environment variable:
- `SOCIAL_NETWORKS_FILE_ID` - Google Drive file ID containing social networks data

## 🚀 Usage

The module is automatically available in the admin module and provides public endpoints for accessing social networks data.

## 📝 Notes

- This is a **public API** - no authentication required
- Data is loaded from Google Drive on startup
- Fallback data is provided if Google Drive is unavailable
- SVG icons are included for UI display
