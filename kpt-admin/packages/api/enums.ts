// API Enums
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  URL_ENCODED = 'application/x-www-form-urlencoded'
}

export enum ApiBaseUrl {
  Settings = '/admin/settings',
  ActivityTypes = '/admin/activity-types',
  Admins = '/admin',
  Articles = '/admin/articles',
  Backup = '/admin/backup',
  SocialNetworks = '/admin/social-networks',
  MoodSurveys = '/admin/mood-surveys',
  MoodTypes = '/admin/mood-types',
  OnboardingQuestions = '/admin/onboarding-questions',
  Programs = '/admin/programs',
  Queue = '/admin/queue',
  Surveys = '/admin/surveys',
  Stats = '/admin',
  Tooltips = '/admin/tooltips',
  Clients = '/admin/clients',
  Languages = '/admin/languages',
  Notifications = '/admin/notifications',
  Subscriptions = '/admin/subscriptions',
}

