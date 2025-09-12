/**
 * Unified Error Codes for KPT Application
 * 
 * This file contains all error codes organized by module and functionality.
 * Each module has its own range of codes to avoid conflicts.
 * 
 * Error Code Ranges:
 * - 1000-1999: Admin Module
 * - 2000-2999: Auth Module  
 * - 3000-3999: CLI Module
 * - 4000-4999: Profile Module
 * - 5000-5999: Suggested Activity Module
 * - 6000-6999: Email Module
 * - 7000-7999: Firebase Module
 * - 8000-8999: Google Drive Module
 * - 9000-9999: Common/System Errors
 */

export enum ErrorCode {
  // ========================================
  // ADMIN MODULE (1000-1999)
  // ========================================
  
  // Authentication & Authorization (1000-1099)
  ADMIN_INVALID_CREDENTIALS = '1001',
  ADMIN_INSUFFICIENT_PERMISSIONS = '1002',
  ADMIN_ACCOUNT_NO_PASSWORD_SUPPORT = '1003',
  ADMIN_EMAIL_NOT_VERIFIED = '1004',
  ADMIN_TOKEN_EXPIRED = '1005',
  ADMIN_TOKEN_INVALID = '1006',
  ADMIN_ROLE_REQUIRED = '1007',

  // User Management (1100-1199)
  ADMIN_USER_NOT_FOUND = '1101',
  USER_NOT_FOUND = '1102',
  ADMIN_USER_ALREADY_EXISTS = '1103',
  ADMIN_USER_INACTIVE = '1104',
  ADMIN_USER_ARCHIVED = '1105',
  ADMIN_CANNOT_DELETE_ADMIN = '1106',
  ADMIN_CANNOT_MODIFY_ADMIN_ROLE = '1107',

  // Language Management (1200-1299)
  ADMIN_LANGUAGE_NOT_FOUND = '1201',
  ADMIN_LANGUAGE_CODE_EXISTS = '1202',
  ADMIN_LANGUAGE_INVALID_CODE = '1203',
  ADMIN_LANGUAGE_INVALID_TEMPLATE = '1204',
  ADMIN_LANGUAGE_ARCHIVE_FAILED = '1205',
  ADMIN_LANGUAGE_RESTORE_FAILED = '1206',
  ADMIN_LANGUAGE_SYNC_FAILED = '1207',
  ADMIN_LANGUAGE_ALREADY_ARCHIVED = '1208',
  ADMIN_LANGUAGE_NOT_IN_ARCHIVE = '1209',
  ADMIN_LANGUAGE_CANNOT_ARCHIVE_DEFAULT = '1210',
  ADMIN_LANGUAGE_ARCHIVE_METADATA_UPDATE_FAILED = '1211',
  ADMIN_LANGUAGE_RESTORE_METADATA_UPDATE_FAILED = '1212',

  // Statistics & Reporting (1300-1399)
  ADMIN_STATS_GENERATION_FAILED = '1301',
  ADMIN_INVALID_DATE_RANGE = '1302',
  ADMIN_REPORT_GENERATION_FAILED = '1303',

  // System & Configuration (1400-1499)
  ADMIN_CONFIGURATION_ERROR = '1401',
  ADMIN_EXTERNAL_SERVICE_UNAVAILABLE = '1402',
  ADMIN_DATABASE_CONNECTION_FAILED = '1403',
  ADMIN_FILE_OPERATION_FAILED = '1404',

  // Google Drive Integration (1500-1599)
  ADMIN_GOOGLE_DRIVE_CONNECTION_FAILED = '1501',
  ADMIN_GOOGLE_DRIVE_FILE_NOT_FOUND = '1502',
  ADMIN_GOOGLE_DRIVE_UPLOAD_FAILED = '1503',
  ADMIN_GOOGLE_DRIVE_DOWNLOAD_FAILED = '1504',
  ADMIN_GOOGLE_DRIVE_PERMISSION_DENIED = '1505',

  // Validation Errors (1600-1699)
  ADMIN_INVALID_INPUT_DATA = '1601',
  ADMIN_MISSING_REQUIRED_FIELDS = '1602',
  ADMIN_INVALID_EMAIL_FORMAT = '1603',
  ADMIN_INVALID_PASSWORD_FORMAT = '1604',
  ADMIN_INVALID_ROLE_ASSIGNMENT = '1605',

  // Rate Limiting & Security (1700-1799)
  ADMIN_TOO_MANY_REQUESTS = '1701',
  ADMIN_ACCOUNT_LOCKED = '1702',
  ADMIN_SUSPICIOUS_ACTIVITY = '1703',
  ADMIN_IP_BLOCKED = '1704',

  // Maintenance & Updates (1800-1899)
  ADMIN_SYSTEM_MAINTENANCE = '1801',
  ADMIN_FEATURE_DISABLED = '1802',
  ADMIN_VERSION_NOT_SUPPORTED = '1803',
  ADMIN_UPDATE_REQUIRED = '1804',

  // Generic Errors (1900-1999)
  ADMIN_INTERNAL_SERVER_ERROR = '1901',
  ADMIN_SERVICE_UNAVAILABLE = '1902',
  ADMIN_TIMEOUT_ERROR = '1903',
  ADMIN_UNKNOWN_ERROR = '1999',

  // Tooltip Management (1950-1998)
  ADMIN_TOOLTIP_NOT_FOUND = '1950',
  ADMIN_TOOLTIP_INVALID_TYPE = '1951',
  ADMIN_TOOLTIP_INVALID_JSON_STRUCTURE = '1952',
  ADMIN_TOOLTIP_CREATION_FAILED = '1953',
  ADMIN_TOOLTIP_UPDATE_FAILED = '1954',
  ADMIN_TOOLTIP_DELETION_FAILED = '1955',
  ADMIN_TOOLTIP_TYPE_NOT_SUPPORTED = '1956',
  ADMIN_TOOLTIP_PAGE_NOT_FOUND = '1957',
  ADMIN_TOOLTIP_INVALID_PAGE_PARAMETER = '1958',
  ADMIN_TOOLTIP_INVALID_TYPE_PARAMETER = '1959',

  // ========================================
  // AUTH MODULE (2000-2999)
  // ========================================
  
  // Authentication & Authorization (2000-2099)
  AUTH_INVALID_CREDENTIALS = '2001',
  AUTH_USER_NOT_FOUND = '2002',
  AUTH_ACCOUNT_DISABLED = '2003',
  AUTH_ACCOUNT_LOCKED = '2004',
  AUTH_INSUFFICIENT_PERMISSIONS = '2005',
  AUTH_SESSION_EXPIRED = '2006',
  AUTH_INVALID_SESSION = '2007',

  // User Registration & Login (2100-2199)
  AUTH_USER_ALREADY_EXISTS = '2101',
  AUTH_INVALID_EMAIL_FORMAT = '2102',
  AUTH_INVALID_PASSWORD_FORMAT = '2103',
  AUTH_EMAIL_ALREADY_VERIFIED = '2104',
  AUTH_REGISTRATION_DISABLED = '2105',
  AUTH_LOGIN_DISABLED = '2106',

  // Password Management (2200-2299)
  AUTH_PASSWORD_TOO_WEAK = '2201',
  AUTH_PASSWORD_MISMATCH = '2202',
  AUTH_PASSWORD_RESET_EXPIRED = '2203',
  AUTH_PASSWORD_RESET_INVALID = '2204',
  AUTH_PASSWORD_CHANGE_FAILED = '2205',
  AUTH_OLD_PASSWORD_INCORRECT = '2206',

  // Token Management (2300-2399)
  AUTH_TOKEN_NOT_FOUND = '2301',
  AUTH_TOKEN_EXPIRED = '2302',
  AUTH_TOKEN_INVALID = '2303',
  AUTH_TOKEN_REVOKED = '2304',
  AUTH_TOKEN_MALFORMED = '2305',
  AUTH_TOKEN_TYPE_INVALID = '2306',
  AUTH_REFRESH_TOKEN_INVALID = '2307',
  AUTH_REFRESH_TOKEN_EXPIRED = '2308',

  // Firebase Integration (2400-2499)
  AUTH_FIREBASE_TOKEN_INVALID = '2401',
  AUTH_FIREBASE_TOKEN_EXPIRED = '2402',
  AUTH_FIREBASE_USER_NOT_FOUND = '2403',
  AUTH_FIREBASE_AUTH_FAILED = '2404',
  AUTH_FIREBASE_CONNECTION_FAILED = '2405',
  AUTH_FIREBASE_PERMISSION_DENIED = '2406',

  // Security & Validation (2500-2599)
  AUTH_TOO_MANY_LOGIN_ATTEMPTS = '2501',
  AUTH_SUSPICIOUS_ACTIVITY = '2502',
  AUTH_IP_BLOCKED = '2503',
  AUTH_DEVICE_NOT_TRUSTED = '2504',
  AUTH_LOCATION_RESTRICTED = '2505',
  AUTH_TIME_RESTRICTED = '2506',

  // Redis & Blacklist (2600-2699)
  AUTH_REDIS_CONNECTION_FAILED = '2601',
  AUTH_BLACKLIST_CHECK_FAILED = '2602',
  AUTH_TOKEN_ADD_TO_BLACKLIST_FAILED = '2603',
  AUTH_TOKEN_REMOVE_FROM_BLACKLIST_FAILED = '2604',
  AUTH_BLACKLIST_CLEANUP_FAILED = '2605',

  // Email Verification (2700-2799)
  AUTH_EMAIL_VERIFICATION_FAILED = '2701',
  AUTH_EMAIL_VERIFICATION_EXPIRED = '2702',
  AUTH_EMAIL_VERIFICATION_INVALID = '2703',
  AUTH_EMAIL_SEND_FAILED = '2704',
  AUTH_EMAIL_VERIFICATION_TEMPLATE_NOT_FOUND = '2705',

  // Rate Limiting (2800-2899)
  AUTH_RATE_LIMIT_EXCEEDED = '2801',
  AUTH_TOO_MANY_REQUESTS = '2802',
  AUTH_REQUEST_THROTTLED = '2803',
  AUTH_COOLDOWN_PERIOD = '2804',

  // Generic Auth Errors (2900-2999)
  AUTH_AUTHENTICATION_FAILED = '2901',
  AUTH_AUTHORIZATION_FAILED = '2902',
  AUTH_VALIDATION_FAILED = '2903',
  AUTH_INTERNAL_AUTH_ERROR = '2904',
  AUTH_EXTERNAL_SERVICE_UNAVAILABLE = '2905',
  AUTH_UNKNOWN_AUTH_ERROR = '2999',

  // ========================================
  // CLI MODULE (3000-3999)
  // ========================================
  
  // CLI General Errors (3000-3099)
  CLI_INITIALIZATION_FAILED = '3001',
  CLI_COMMAND_NOT_FOUND = '3002',
  CLI_INVALID_COMMAND_ARGS = '3003',
  CLI_COMMAND_EXECUTION_FAILED = '3004',
  CLI_SHUTDOWN_FAILED = '3005',
  
  // Administrator Management (3100-3199)
  CLI_ADMIN_CREATION_FAILED = '3101',
  CLI_ADMIN_REMOVAL_FAILED = '3102',
  CLI_ADMIN_NOT_FOUND = '3103',
  CLI_ADMIN_ALREADY_EXISTS = '3104',
  CLI_ADMIN_ROLE_INVALID = '3105',
  CLI_ADMIN_PERMISSION_DENIED = '3106',
  
  // User Operations (3200-3299)
  CLI_USER_CREATION_FAILED = '3201',
  CLI_USER_UPDATE_FAILED = '3202',
  CLI_USER_DELETION_FAILED = '3203',
  CLI_USER_NOT_FOUND = '3204',
  CLI_USER_ALREADY_EXISTS = '3205',
  CLI_USER_VALIDATION_FAILED = '3206',
  
  // Database Operations (3300-3399)
  CLI_DATABASE_CONNECTION_FAILED = '3301',
  CLI_DATABASE_QUERY_FAILED = '3302',
  CLI_DATABASE_TRANSACTION_FAILED = '3303',
  CLI_DATABASE_MIGRATION_FAILED = '3304',
  CLI_DATABASE_BACKUP_FAILED = '3305',
  
  // Validation Errors (3400-3499)
  CLI_INVALID_EMAIL_FORMAT = '3401',
  CLI_INVALID_PASSWORD_FORMAT = '3402',
  CLI_INVALID_NAME_FORMAT = '3403',
  CLI_MISSING_REQUIRED_FIELDS = '3404',
  CLI_INVALID_COMMAND_OPTIONS = '3405',
  
  // System Errors (3500-3599)
  CLI_SYSTEM_RESOURCE_UNAVAILABLE = '3501',
  CLI_MEMORY_ALLOCATION_FAILED = '3502',
  CLI_PROCESS_CREATION_FAILED = '3503',
  CLI_SIGNAL_HANDLING_FAILED = '3504',
  
  // File Operations (3600-3699)
  CLI_FILE_READ_FAILED = '3601',
  CLI_FILE_WRITE_FAILED = '3602',
  CLI_FILE_NOT_FOUND = '3603',
  CLI_FILE_PERMISSION_DENIED = '3604',
  CLI_DIRECTORY_CREATION_FAILED = '3605',
  
  // Configuration Errors (3700-3799)
  CLI_CONFIG_LOAD_FAILED = '3701',
  CLI_ENV_VAR_MISSING = '3702',
  CLI_CONFIG_VALIDATION_FAILED = '3703',
  CLI_CONFIG_PARSE_FAILED = '3704',
  
  // Authentication Errors (3800-3899)
  CLI_AUTH_CREDENTIALS_INVALID = '3801',
  CLI_AUTH_TOKEN_EXPIRED = '3802',
  CLI_AUTH_PERMISSION_DENIED = '3803',
  CLI_AUTH_SESSION_INVALID = '3804',
  
  // Generic CLI Errors (3900-3999)
  CLI_UNKNOWN_ERROR = '3901',
  CLI_INTERNAL_ERROR = '3902',
  CLI_NOT_IMPLEMENTED = '3903',
  CLI_DEPRECATED_FEATURE = '3904',
  CLI_ERROR = '3999',

  // ========================================
  // PROFILE MODULE (4000-4999)
  // ========================================
  
  // User Profile Management (4000-4099)
  PROFILE_USER_NOT_FOUND = '4001',
  PROFILE_UPDATE_FAILED = '4002',
  PROFILE_INVALID_DATA = '4003',
  PROFILE_AVATAR_UPLOAD_FAILED = '4004',
  PROFILE_THEME_INVALID = '4005',
  PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED = '4006',
  PROFILE_INVALID_PASSWORD = '4007',
  PROFILE_EMAIL_ALREADY_EXISTS = '4008',
  PROFILE_INVALID_VERIFICATION_TOKEN = '4009',
  PROFILE_ACCOUNT_DELETION_NOT_CONFIRMED = '4010',
  PROFILE_SOCIAL_ACCOUNT_RESTRICTION = '4011',

  // Activity Management (4012-4099)
  PROFILE_ACTIVITY_NOT_FOUND = '4012',
  PROFILE_ACTIVITY_CREATION_FAILED = '4013',
  PROFILE_ACTIVITY_UPDATE_FAILED = '4014',
  PROFILE_ACTIVITY_DELETION_FAILED = '4015',
  PROFILE_ACTIVITY_VALIDATION_FAILED = '4016',
  PROFILE_ACTIVITY_TYPE_NOT_FOUND = '4017',
  PROFILE_ACTIVITY_LIMIT_EXCEEDED = '4018',
  PROFILE_ACTIVITY_ALREADY_CLOSED = '4019',
  PROFILE_ACTIVITY_CANNOT_MODIFY_CLOSED = '4020',
  PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED = '4021',
  PROFILE_ACTIVITY_RATE_ACTIVITY_CREATION_FAILED = '4022',
  PROFILE_ACTIVITY_TYPE_DETERMINATION_FAILED = '4023',
  PROFILE_ACTIVITY_GOOGLE_DRIVE_UNAVAILABLE = '4024',
  PROFILE_ACTIVITY_INVALID_CONTENT_FORMAT = '4025',

  // Mood Tracking (4100-4199)
  PROFILE_MOOD_NOT_FOUND = '4101',
  PROFILE_MOOD_CREATION_FAILED = '4102',
  PROFILE_MOOD_UPDATE_FAILED = '4103',
  PROFILE_MOOD_DELETION_FAILED = '4104',
  PROFILE_MOOD_VALIDATION_FAILED = '4105',
  PROFILE_MOOD_TYPE_NOT_FOUND = '4106',

  // Analytics (4200-4299)
  PROFILE_ANALYTICS_GENERATION_FAILED = '4201',
  PROFILE_ANALYTICS_INVALID_DATE_RANGE = '4202',
  PROFILE_ANALYTICS_DATA_NOT_FOUND = '4203',

  // ========================================
  // SUGGESTED ACTIVITY MODULE (5000-5999)
  // ========================================
  
  // Activity Generation (5000-5099)
  SUGGESTED_ACTIVITY_GENERATION_FAILED = '5001',
  SUGGESTED_ACTIVITY_AI_SERVICE_UNAVAILABLE = '5002',
  SUGGESTED_ACTIVITY_PATTERN_ANALYSIS_FAILED = '5003',
  SUGGESTED_ACTIVITY_CONTENT_GENERATION_FAILED = '5004',
  SUGGESTED_ACTIVITY_REASONING_GENERATION_FAILED = '5005',
  SUGGESTED_ACTIVITY_NOT_FOUND = '5006',
  SUGGESTED_ACTIVITY_DAILY_LIMIT_EXCEEDED = '5007',
  SUGGESTED_ACTIVITY_ALREADY_USED = '5008',
  SUGGESTED_ACTIVITY_REFRESH_FAILED = '5009',

  // Suggested Activity Queue (5100-5199)
  SUGGESTED_ACTIVITY_QUEUE_JOB_FAILED = '5101',
  SUGGESTED_ACTIVITY_QUEUE_PROCESSING_FAILED = '5102',
  SUGGESTED_ACTIVITY_QUEUE_CLEANUP_FAILED = '5103',
  SUGGESTED_ACTIVITY_QUEUE_STATS_FAILED = '5104',
  SUGGESTED_ACTIVITY_QUEUE_ADD_JOB_FAILED = '5105',
  SUGGESTED_ACTIVITY_QUEUE_ADD_CLEANUP_FAILED = '5106',
  SUGGESTED_ACTIVITY_QUEUE_BULK_ADD_FAILED = '5107',
  SUGGESTED_ACTIVITY_QUEUE_GET_STATS_FAILED = '5108',
  SUGGESTED_ACTIVITY_QUEUE_CLEAR_FAILED = '5109',
  SUGGESTED_ACTIVITY_QUEUE_PAUSE_FAILED = '5110',
  SUGGESTED_ACTIVITY_QUEUE_RESUME_FAILED = '5111',

  // Suggested Activity Cron (5200-5299)
  SUGGESTED_ACTIVITY_CRON_GENERATION_FAILED = '5201',
  SUGGESTED_ACTIVITY_CRON_CLEANUP_FAILED = '5202',
  SUGGESTED_ACTIVITY_CRON_SCHEDULING_FAILED = '5203',
  SUGGESTED_ACTIVITY_CRON_ALREADY_PROCESSING = '5204',
  SUGGESTED_ACTIVITY_CRON_HEALTH_CHECK_FAILED = '5205',
  SUGGESTED_ACTIVITY_CRON_MANUAL_GENERATION_FAILED = '5206',

  // Suggested Activity ChatGPT (5300-5399)
  SUGGESTED_ACTIVITY_CHATGPT_API_ERROR = '5301',
  SUGGESTED_ACTIVITY_CHATGPT_CONTENT_PARSE_FAILED = '5302',
  SUGGESTED_ACTIVITY_CHATGPT_PROMPT_BUILD_FAILED = '5303',

  // ========================================
  // EMAIL MODULE (6000-6999)
  // ========================================
  
  // Template Management (6000-6099)
  EMAIL_TEMPLATE_NOT_FOUND = '6001',
  EMAIL_TEMPLATE_LOAD_FAILED = '6002',
  EMAIL_TEMPLATE_RENDER_FAILED = '6003',
  EMAIL_TEMPLATE_INVALID_FORMAT = '6004',
  EMAIL_TEMPLATE_VARIABLE_SUBSTITUTION_FAILED = '6005',
  EMAIL_TEMPLATE_DIRECTORY_ACCESS_FAILED = '6006',

  // Email Sending (6100-6199)
  EMAIL_SEND_FAILED = '6101',
  EMAIL_INVALID_RECIPIENT = '6102',
  EMAIL_INVALID_SENDER = '6103',
  EMAIL_ATTACHMENT_TOO_LARGE = '6104',
  EMAIL_RATE_LIMIT_EXCEEDED = '6105',
  EMAIL_SERVICE_UNAVAILABLE = '6106',
  EMAIL_QUOTA_EXCEEDED = '6107',

  // Configuration & Setup (6200-6299)
  EMAIL_CONFIGURATION_MISSING = '6201',
  EMAIL_FRONTEND_URL_NOT_SET = '6202',
  EMAIL_SMTP_CONFIGURATION_INVALID = '6203',
  EMAIL_TEMPLATE_DIRECTORY_NOT_FOUND = '6204',
  EMAIL_MAILER_SERVICE_UNAVAILABLE = '6205',

  // Validation & Security (6300-6399)
  EMAIL_INVALID_EMAIL_FORMAT = '6301',
  EMAIL_EMAIL_TOO_LONG = '6302',
  EMAIL_SUBJECT_TOO_LONG = '6303',
  EMAIL_CONTENT_TOO_LARGE = '6304',
  EMAIL_SUSPICIOUS_CONTENT = '6305',

  // Generic Errors (6900-6999)
  EMAIL_INTERNAL_SERVER_ERROR = '6901',
  EMAIL_TIMEOUT_ERROR = '6902',
  EMAIL_UNKNOWN_ERROR = '6999',

  // ========================================
  // FIREBASE MODULE (7000-7999)
  // ========================================
  
  // Firebase Initialization & Configuration (7000-7099)
  FIREBASE_INITIALIZATION_FAILED = '7001',
  FIREBASE_CONFIGURATION_MISSING = '7002',
  FIREBASE_CONFIGURATION_INVALID = '7003',
  FIREBASE_CREDENTIALS_INVALID = '7004',
  FIREBASE_PROJECT_NOT_FOUND = '7005',
  FIREBASE_SERVICE_ACCOUNT_ERROR = '7006',

  // Firebase Authentication (7100-7199)
  FIREBASE_AUTH_FAILED = '7101',
  FIREBASE_TOKEN_VERIFICATION_FAILED = '7102',
  FIREBASE_TOKEN_EXPIRED = '7103',
  FIREBASE_TOKEN_INVALID = '7104',
  FIREBASE_TOKEN_REVOKED = '7105',
  FIREBASE_TOKEN_MALFORMED = '7106',
  FIREBASE_USER_NOT_FOUND = '7107',
  FIREBASE_USER_DISABLED = '7108',
  FIREBASE_USER_DELETED = '7109',
  FIREBASE_CUSTOM_TOKEN_CREATION_FAILED = '7110',

  // Firebase Operations (7200-7299)
  FIREBASE_OPERATION_FAILED = '7201',
  FIREBASE_PERMISSION_DENIED = '7202',
  FIREBASE_QUOTA_EXCEEDED = '7203',
  FIREBASE_RATE_LIMIT_EXCEEDED = '7204',
  FIREBASE_TIMEOUT_ERROR = '7205',

  // Firebase External Service (7300-7399)
  FIREBASE_EXTERNAL_SERVICE_UNAVAILABLE = '7301',
  FIREBASE_NETWORK_ERROR = '7302',
  FIREBASE_API_ERROR = '7303',
  FIREBASE_SERVICE_UNAVAILABLE = '7304',

  // Generic Errors (7900-7999)
  FIREBASE_INTERNAL_SERVER_ERROR = '7901',
  FIREBASE_UNKNOWN_ERROR = '7999',

  // ========================================
  // GOOGLE DRIVE MODULE (8000-8999)
  // ========================================
  
  // Google Drive Operations (8000-8099)
  GOOGLE_DRIVE_CONNECTION_FAILED = '8001',
  GOOGLE_DRIVE_FILE_NOT_FOUND = '8002',
  GOOGLE_DRIVE_UPLOAD_FAILED = '8003',
  GOOGLE_DRIVE_DOWNLOAD_FAILED = '8004',
  GOOGLE_DRIVE_PERMISSION_DENIED = '8005',
  GOOGLE_DRIVE_API_QUOTA_EXCEEDED = '8006',

  // ========================================
  // BACKUP MODULE (8500-8999)
  // ========================================
  
  // Database Backup (8500-8599)
  BACKUP_DATABASE_FAILED = '8501',
  BACKUP_UPLOAD_FAILED = '8502',
  BACKUP_DOWNLOAD_FAILED = '8503',
  BACKUP_LIST_FAILED = '8504',
  BACKUP_CREATION_AND_UPLOAD_FAILED = '8505',
  BACKUP_MYSQLDUMP_NOT_AVAILABLE = '8506',
  BACKUP_GOOGLE_DRIVE_UNAVAILABLE = '8507',
  BACKUP_FOLDER_NOT_CONFIGURED = '8508',
  BACKUP_FILE_NOT_FOUND = '8509',
  BACKUP_INVALID_FILE_ID = '8510',
  BACKUP_RESTORE_FAILED = '8511',

  // ========================================
  // COMMON/SYSTEM ERRORS (9000-9999)
  // ========================================
  
  // Common Validation (9000-9099)
  COMMON_INVALID_INPUT = '9001',
  COMMON_MISSING_REQUIRED_FIELDS = '9002',
  COMMON_INVALID_FORMAT = '9003',
  COMMON_VALIDATION_FAILED = '9004',

  // Common Database (9100-9199)
  COMMON_DATABASE_CONNECTION_FAILED = '9101',
  COMMON_DATABASE_QUERY_FAILED = '9102',
  COMMON_DATABASE_TRANSACTION_FAILED = '9103',

  // Common External Services (9200-9299)
  COMMON_EXTERNAL_SERVICE_UNAVAILABLE = '9201',
  COMMON_API_RATE_LIMIT_EXCEEDED = '9202',
  COMMON_NETWORK_ERROR = '9203',

  // Common System (9300-9399)
  COMMON_INTERNAL_SERVER_ERROR = '9301',
  COMMON_SERVICE_UNAVAILABLE = '9302',
  COMMON_TIMEOUT_ERROR = '9303',
  COMMON_UNKNOWN_ERROR = '9399'
}

/**
 * Error Code Descriptions (for documentation and logging)
 */
export const ErrorDescription: Record<ErrorCode, string> = {
  // Admin Module
  [ErrorCode.ADMIN_INVALID_CREDENTIALS]: 'Invalid email or password provided',
  [ErrorCode.ADMIN_INSUFFICIENT_PERMISSIONS]: 'User does not have required permissions',
  [ErrorCode.ADMIN_ACCOUNT_NO_PASSWORD_SUPPORT]: 'Account does not support password authentication',
  [ErrorCode.ADMIN_EMAIL_NOT_VERIFIED]: 'Email address is not verified',
  [ErrorCode.ADMIN_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.ADMIN_TOKEN_INVALID]: 'Authentication token is invalid',
  [ErrorCode.ADMIN_ROLE_REQUIRED]: 'Administrator role is required for this operation',
  [ErrorCode.ADMIN_USER_NOT_FOUND]: 'User with specified ID not found',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.ADMIN_USER_ALREADY_EXISTS]: 'User with this email already exists',
  [ErrorCode.ADMIN_USER_INACTIVE]: 'User account is inactive',
  [ErrorCode.ADMIN_USER_ARCHIVED]: 'User account is archived',
  [ErrorCode.ADMIN_CANNOT_DELETE_ADMIN]: 'Cannot delete administrator account',
  [ErrorCode.ADMIN_CANNOT_MODIFY_ADMIN_ROLE]: 'Cannot modify administrator role',
  [ErrorCode.ADMIN_LANGUAGE_NOT_FOUND]: 'Language with specified ID not found',
  [ErrorCode.ADMIN_LANGUAGE_CODE_EXISTS]: 'Language with this code already exists',
  [ErrorCode.ADMIN_LANGUAGE_INVALID_CODE]: 'Invalid language code format',
  [ErrorCode.ADMIN_LANGUAGE_INVALID_TEMPLATE]: 'Invalid language template structure',
  [ErrorCode.ADMIN_LANGUAGE_ARCHIVE_FAILED]: 'Failed to archive language',
  [ErrorCode.ADMIN_LANGUAGE_RESTORE_FAILED]: 'Failed to restore language',
  [ErrorCode.ADMIN_LANGUAGE_SYNC_FAILED]: 'Failed to synchronize language with Google Drive',
  [ErrorCode.ADMIN_LANGUAGE_ALREADY_ARCHIVED]: 'Language is already archived',
  [ErrorCode.ADMIN_LANGUAGE_NOT_IN_ARCHIVE]: 'Language is not in archive',
  [ErrorCode.ADMIN_LANGUAGE_CANNOT_ARCHIVE_DEFAULT]: 'Cannot archive default language',
  [ErrorCode.ADMIN_LANGUAGE_ARCHIVE_METADATA_UPDATE_FAILED]: 'Failed to update language archive metadata',
  [ErrorCode.ADMIN_LANGUAGE_RESTORE_METADATA_UPDATE_FAILED]: 'Failed to update language restore metadata',
  [ErrorCode.ADMIN_STATS_GENERATION_FAILED]: 'Failed to generate statistics',
  [ErrorCode.ADMIN_INVALID_DATE_RANGE]: 'Invalid date range provided',
  [ErrorCode.ADMIN_REPORT_GENERATION_FAILED]: 'Failed to generate report',
  [ErrorCode.ADMIN_CONFIGURATION_ERROR]: 'System configuration error',
  [ErrorCode.ADMIN_EXTERNAL_SERVICE_UNAVAILABLE]: 'External service is unavailable',
  [ErrorCode.ADMIN_DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ErrorCode.ADMIN_FILE_OPERATION_FAILED]: 'File operation failed',
  [ErrorCode.ADMIN_GOOGLE_DRIVE_CONNECTION_FAILED]: 'Google Drive connection failed',
  [ErrorCode.ADMIN_GOOGLE_DRIVE_FILE_NOT_FOUND]: 'File not found in Google Drive',
  [ErrorCode.ADMIN_GOOGLE_DRIVE_UPLOAD_FAILED]: 'Failed to upload file to Google Drive',
  [ErrorCode.ADMIN_GOOGLE_DRIVE_DOWNLOAD_FAILED]: 'Failed to download file from Google Drive',
  [ErrorCode.ADMIN_GOOGLE_DRIVE_PERMISSION_DENIED]: 'Permission denied for Google Drive operation',
  [ErrorCode.ADMIN_INVALID_INPUT_DATA]: 'Invalid input data provided',
  [ErrorCode.ADMIN_MISSING_REQUIRED_FIELDS]: 'Required fields are missing',
  [ErrorCode.ADMIN_INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.ADMIN_INVALID_PASSWORD_FORMAT]: 'Invalid password format',
  [ErrorCode.ADMIN_INVALID_ROLE_ASSIGNMENT]: 'Invalid role assignment',
  [ErrorCode.ADMIN_TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
  [ErrorCode.ADMIN_ACCOUNT_LOCKED]: 'Account is temporarily locked',
  [ErrorCode.ADMIN_SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
  [ErrorCode.ADMIN_IP_BLOCKED]: 'IP address is blocked',
  [ErrorCode.ADMIN_SYSTEM_MAINTENANCE]: 'System is under maintenance',
  [ErrorCode.ADMIN_FEATURE_DISABLED]: 'Feature is temporarily disabled',
  [ErrorCode.ADMIN_VERSION_NOT_SUPPORTED]: 'Current version is not supported',
  [ErrorCode.ADMIN_UPDATE_REQUIRED]: 'System update is required',
  [ErrorCode.ADMIN_INTERNAL_SERVER_ERROR]: 'Internal server error occurred',
  [ErrorCode.ADMIN_SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  [ErrorCode.ADMIN_TIMEOUT_ERROR]: 'Operation timed out',
  [ErrorCode.ADMIN_UNKNOWN_ERROR]: 'Unknown error occurred',
  [ErrorCode.ADMIN_TOOLTIP_NOT_FOUND]: 'Tooltip not found',
  [ErrorCode.ADMIN_TOOLTIP_INVALID_TYPE]: 'Invalid tooltip type',
  [ErrorCode.ADMIN_TOOLTIP_INVALID_JSON_STRUCTURE]: 'Invalid JSON structure for tooltip',
  [ErrorCode.ADMIN_TOOLTIP_CREATION_FAILED]: 'Failed to create tooltip',
  [ErrorCode.ADMIN_TOOLTIP_UPDATE_FAILED]: 'Failed to update tooltip',
  [ErrorCode.ADMIN_TOOLTIP_DELETION_FAILED]: 'Failed to delete tooltip',
  [ErrorCode.ADMIN_TOOLTIP_TYPE_NOT_SUPPORTED]: 'Tooltip type not supported',
  [ErrorCode.ADMIN_TOOLTIP_PAGE_NOT_FOUND]: 'Tooltip page not found',
  [ErrorCode.ADMIN_TOOLTIP_INVALID_PAGE_PARAMETER]: 'Invalid tooltip page parameter',
  [ErrorCode.ADMIN_TOOLTIP_INVALID_TYPE_PARAMETER]: 'Invalid tooltip type parameter',

  // Auth Module
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password provided',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'User with specified email not found',
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: 'User account is disabled',
  [ErrorCode.AUTH_ACCOUNT_LOCKED]: 'User account is temporarily locked',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'User does not have required permissions',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'User session has expired',
  [ErrorCode.AUTH_INVALID_SESSION]: 'Invalid user session',
  [ErrorCode.AUTH_USER_ALREADY_EXISTS]: 'User with this email already exists',
  [ErrorCode.AUTH_INVALID_EMAIL_FORMAT]: 'Invalid email format provided',
  [ErrorCode.AUTH_INVALID_PASSWORD_FORMAT]: 'Invalid password format provided',
  [ErrorCode.AUTH_EMAIL_ALREADY_VERIFIED]: 'Email is already verified',
  [ErrorCode.AUTH_REGISTRATION_DISABLED]: 'User registration is currently disabled',
  [ErrorCode.AUTH_LOGIN_DISABLED]: 'User login is currently disabled',
  [ErrorCode.AUTH_PASSWORD_TOO_WEAK]: 'Password does not meet security requirements',
  [ErrorCode.AUTH_PASSWORD_MISMATCH]: 'Password confirmation does not match',
  [ErrorCode.AUTH_PASSWORD_RESET_EXPIRED]: 'Password reset token has expired',
  [ErrorCode.AUTH_PASSWORD_RESET_INVALID]: 'Password reset token is invalid',
  [ErrorCode.AUTH_PASSWORD_CHANGE_FAILED]: 'Failed to change password',
  [ErrorCode.AUTH_OLD_PASSWORD_INCORRECT]: 'Old password is incorrect',
  [ErrorCode.AUTH_TOKEN_NOT_FOUND]: 'Authentication token not found in request',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Authentication token is invalid',
  [ErrorCode.AUTH_TOKEN_REVOKED]: 'Authentication token has been revoked',
  [ErrorCode.AUTH_TOKEN_MALFORMED]: 'Authentication token is malformed',
  [ErrorCode.AUTH_TOKEN_TYPE_INVALID]: 'Invalid token type provided',
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: 'Refresh token is invalid',
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired',
  [ErrorCode.AUTH_FIREBASE_TOKEN_INVALID]: 'Firebase ID token is invalid',
  [ErrorCode.AUTH_FIREBASE_TOKEN_EXPIRED]: 'Firebase ID token has expired',
  [ErrorCode.AUTH_FIREBASE_USER_NOT_FOUND]: 'Firebase user not found',
  [ErrorCode.AUTH_FIREBASE_AUTH_FAILED]: 'Firebase authentication failed',
  [ErrorCode.AUTH_FIREBASE_CONNECTION_FAILED]: 'Firebase connection failed',
  [ErrorCode.AUTH_FIREBASE_PERMISSION_DENIED]: 'Firebase permission denied',
  [ErrorCode.AUTH_TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts, account temporarily locked',
  [ErrorCode.AUTH_SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
  [ErrorCode.AUTH_IP_BLOCKED]: 'IP address is blocked',
  [ErrorCode.AUTH_DEVICE_NOT_TRUSTED]: 'Device is not trusted',
  [ErrorCode.AUTH_LOCATION_RESTRICTED]: 'Access restricted from this location',
  [ErrorCode.AUTH_TIME_RESTRICTED]: 'Access restricted at this time',
  [ErrorCode.AUTH_REDIS_CONNECTION_FAILED]: 'Redis connection failed',
  [ErrorCode.AUTH_BLACKLIST_CHECK_FAILED]: 'Failed to check token blacklist',
  [ErrorCode.AUTH_TOKEN_ADD_TO_BLACKLIST_FAILED]: 'Failed to add token to blacklist',
  [ErrorCode.AUTH_TOKEN_REMOVE_FROM_BLACKLIST_FAILED]: 'Failed to remove token from blacklist',
  [ErrorCode.AUTH_BLACKLIST_CLEANUP_FAILED]: 'Failed to cleanup expired tokens from blacklist',
  [ErrorCode.AUTH_EMAIL_VERIFICATION_FAILED]: 'Email verification failed',
  [ErrorCode.AUTH_EMAIL_VERIFICATION_EXPIRED]: 'Email verification token has expired',
  [ErrorCode.AUTH_EMAIL_VERIFICATION_INVALID]: 'Email verification token is invalid',
  [ErrorCode.AUTH_EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCode.AUTH_EMAIL_VERIFICATION_TEMPLATE_NOT_FOUND]: 'Email verification template not found',
  [ErrorCode.AUTH_RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.AUTH_TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
  [ErrorCode.AUTH_REQUEST_THROTTLED]: 'Request has been throttled',
  [ErrorCode.AUTH_COOLDOWN_PERIOD]: 'Please wait before making another request',
  [ErrorCode.AUTH_AUTHENTICATION_FAILED]: 'Authentication failed',
  [ErrorCode.AUTH_AUTHORIZATION_FAILED]: 'Authorization failed',
  [ErrorCode.AUTH_VALIDATION_FAILED]: 'Request validation failed',
  [ErrorCode.AUTH_INTERNAL_AUTH_ERROR]: 'Internal authentication error occurred',
  [ErrorCode.AUTH_EXTERNAL_SERVICE_UNAVAILABLE]: 'External authentication service unavailable',
  [ErrorCode.AUTH_UNKNOWN_AUTH_ERROR]: 'Unknown authentication error occurred',

  // CLI Module
  [ErrorCode.CLI_INITIALIZATION_FAILED]: 'CLI initialization failed',
  [ErrorCode.CLI_COMMAND_NOT_FOUND]: 'Command not found',
  [ErrorCode.CLI_INVALID_COMMAND_ARGS]: 'Invalid command arguments',
  [ErrorCode.CLI_COMMAND_EXECUTION_FAILED]: 'Command execution failed',
  [ErrorCode.CLI_SHUTDOWN_FAILED]: 'CLI shutdown failed',
  [ErrorCode.CLI_ADMIN_CREATION_FAILED]: 'Administrator creation failed',
  [ErrorCode.CLI_ADMIN_REMOVAL_FAILED]: 'Administrator removal failed',
  [ErrorCode.CLI_ADMIN_NOT_FOUND]: 'Administrator not found',
  [ErrorCode.CLI_ADMIN_ALREADY_EXISTS]: 'Administrator already exists',
  [ErrorCode.CLI_ADMIN_ROLE_INVALID]: 'Invalid administrator role',
  [ErrorCode.CLI_ADMIN_PERMISSION_DENIED]: 'Administrator permission denied',
  [ErrorCode.CLI_USER_CREATION_FAILED]: 'User creation failed',
  [ErrorCode.CLI_USER_UPDATE_FAILED]: 'User update failed',
  [ErrorCode.CLI_USER_DELETION_FAILED]: 'User deletion failed',
  [ErrorCode.CLI_USER_NOT_FOUND]: 'User not found',
  [ErrorCode.CLI_USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.CLI_USER_VALIDATION_FAILED]: 'User validation failed',
  [ErrorCode.CLI_DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ErrorCode.CLI_DATABASE_QUERY_FAILED]: 'Database query failed',
  [ErrorCode.CLI_DATABASE_TRANSACTION_FAILED]: 'Database transaction failed',
  [ErrorCode.CLI_DATABASE_MIGRATION_FAILED]: 'Database migration failed',
  [ErrorCode.CLI_DATABASE_BACKUP_FAILED]: 'Database backup failed',
  [ErrorCode.CLI_INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.CLI_INVALID_PASSWORD_FORMAT]: 'Invalid password format',
  [ErrorCode.CLI_INVALID_NAME_FORMAT]: 'Invalid name format',
  [ErrorCode.CLI_MISSING_REQUIRED_FIELDS]: 'Missing required fields',
  [ErrorCode.CLI_INVALID_COMMAND_OPTIONS]: 'Invalid command options',
  [ErrorCode.CLI_SYSTEM_RESOURCE_UNAVAILABLE]: 'System resource unavailable',
  [ErrorCode.CLI_MEMORY_ALLOCATION_FAILED]: 'Memory allocation failed',
  [ErrorCode.CLI_PROCESS_CREATION_FAILED]: 'Process creation failed',
  [ErrorCode.CLI_SIGNAL_HANDLING_FAILED]: 'Signal handling failed',
  [ErrorCode.CLI_FILE_READ_FAILED]: 'File read failed',
  [ErrorCode.CLI_FILE_WRITE_FAILED]: 'File write failed',
  [ErrorCode.CLI_FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.CLI_FILE_PERMISSION_DENIED]: 'File permission denied',
  [ErrorCode.CLI_DIRECTORY_CREATION_FAILED]: 'Directory creation failed',
  [ErrorCode.CLI_CONFIG_LOAD_FAILED]: 'Configuration load failed',
  [ErrorCode.CLI_ENV_VAR_MISSING]: 'Environment variable missing',
  [ErrorCode.CLI_CONFIG_VALIDATION_FAILED]: 'Configuration validation failed',
  [ErrorCode.CLI_CONFIG_PARSE_FAILED]: 'Configuration parse failed',
  [ErrorCode.CLI_AUTH_CREDENTIALS_INVALID]: 'Authentication credentials invalid',
  [ErrorCode.CLI_AUTH_TOKEN_EXPIRED]: 'Authentication token expired',
  [ErrorCode.CLI_AUTH_PERMISSION_DENIED]: 'Authentication permission denied',
  [ErrorCode.CLI_AUTH_SESSION_INVALID]: 'Authentication session invalid',
  [ErrorCode.CLI_UNKNOWN_ERROR]: 'Unknown error occurred',
  [ErrorCode.CLI_INTERNAL_ERROR]: 'Internal error occurred',
  [ErrorCode.CLI_NOT_IMPLEMENTED]: 'Feature not implemented',
  [ErrorCode.CLI_DEPRECATED_FEATURE]: 'Feature is deprecated',
  [ErrorCode.CLI_ERROR]: 'CLI error occurred',

  // Profile Module
  [ErrorCode.PROFILE_USER_NOT_FOUND]: 'User not found',
  [ErrorCode.PROFILE_UPDATE_FAILED]: 'Profile update failed',
  [ErrorCode.PROFILE_INVALID_DATA]: 'Invalid profile data',
  [ErrorCode.PROFILE_AVATAR_UPLOAD_FAILED]: 'Avatar upload failed',
  [ErrorCode.PROFILE_THEME_INVALID]: 'Invalid theme',
  [ErrorCode.PROFILE_PASSWORD_CHANGE_NOT_SUPPORTED]: 'Password change not supported for this account',
  [ErrorCode.PROFILE_INVALID_PASSWORD]: 'Invalid password',
  [ErrorCode.PROFILE_EMAIL_ALREADY_EXISTS]: 'Email already exists',
  [ErrorCode.PROFILE_INVALID_VERIFICATION_TOKEN]: 'Invalid verification token',
  [ErrorCode.PROFILE_ACCOUNT_DELETION_NOT_CONFIRMED]: 'Account deletion not confirmed',
  [ErrorCode.PROFILE_SOCIAL_ACCOUNT_RESTRICTION]: 'Operation not allowed for social media accounts',
  [ErrorCode.PROFILE_ACTIVITY_NOT_FOUND]: 'Activity not found',
  [ErrorCode.PROFILE_ACTIVITY_CREATION_FAILED]: 'Activity creation failed',
  [ErrorCode.PROFILE_ACTIVITY_UPDATE_FAILED]: 'Activity update failed',
  [ErrorCode.PROFILE_ACTIVITY_DELETION_FAILED]: 'Activity deletion failed',
  [ErrorCode.PROFILE_ACTIVITY_VALIDATION_FAILED]: 'Activity validation failed',
  [ErrorCode.PROFILE_ACTIVITY_TYPE_NOT_FOUND]: 'Activity type not found',
  [ErrorCode.PROFILE_ACTIVITY_LIMIT_EXCEEDED]: 'Activity limit exceeded',
  [ErrorCode.PROFILE_ACTIVITY_ALREADY_CLOSED]: 'Activity is already closed',
  [ErrorCode.PROFILE_ACTIVITY_CANNOT_MODIFY_CLOSED]: 'Cannot modify closed activity',
  [ErrorCode.PROFILE_ACTIVITY_CANNOT_DELETE_CLOSED]: 'Cannot delete closed activity',
  [ErrorCode.PROFILE_ACTIVITY_RATE_ACTIVITY_CREATION_FAILED]: 'Failed to create rate activity',
  [ErrorCode.PROFILE_ACTIVITY_TYPE_DETERMINATION_FAILED]: 'Failed to determine activity type',
  [ErrorCode.PROFILE_ACTIVITY_GOOGLE_DRIVE_UNAVAILABLE]: 'Google Drive not available for activity operations',
  [ErrorCode.PROFILE_ACTIVITY_INVALID_CONTENT_FORMAT]: 'Invalid activity content format',
  [ErrorCode.PROFILE_MOOD_NOT_FOUND]: 'Mood entry not found',
  [ErrorCode.PROFILE_MOOD_CREATION_FAILED]: 'Mood creation failed',
  [ErrorCode.PROFILE_MOOD_UPDATE_FAILED]: 'Mood update failed',
  [ErrorCode.PROFILE_MOOD_DELETION_FAILED]: 'Mood deletion failed',
  [ErrorCode.PROFILE_MOOD_VALIDATION_FAILED]: 'Mood validation failed',
  [ErrorCode.PROFILE_MOOD_TYPE_NOT_FOUND]: 'Mood type not found',
  [ErrorCode.PROFILE_ANALYTICS_GENERATION_FAILED]: 'Analytics generation failed',
  [ErrorCode.PROFILE_ANALYTICS_INVALID_DATE_RANGE]: 'Invalid date range for analytics',
  [ErrorCode.PROFILE_ANALYTICS_DATA_NOT_FOUND]: 'Analytics data not found',

  // Suggested Activity Module
  [ErrorCode.SUGGESTED_ACTIVITY_GENERATION_FAILED]: 'Suggested activity generation failed',
  [ErrorCode.SUGGESTED_ACTIVITY_AI_SERVICE_UNAVAILABLE]: 'AI service unavailable for activity generation',
  [ErrorCode.SUGGESTED_ACTIVITY_PATTERN_ANALYSIS_FAILED]: 'Activity pattern analysis failed',
  [ErrorCode.SUGGESTED_ACTIVITY_CONTENT_GENERATION_FAILED]: 'Activity content generation failed',
  [ErrorCode.SUGGESTED_ACTIVITY_REASONING_GENERATION_FAILED]: 'Activity reasoning generation failed',
  [ErrorCode.SUGGESTED_ACTIVITY_NOT_FOUND]: 'Suggested activity not found',
  [ErrorCode.SUGGESTED_ACTIVITY_DAILY_LIMIT_EXCEEDED]: 'Daily suggested activity limit exceeded',
  [ErrorCode.SUGGESTED_ACTIVITY_ALREADY_USED]: 'Suggested activity already used today',
  [ErrorCode.SUGGESTED_ACTIVITY_REFRESH_FAILED]: 'Failed to refresh suggested activities',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_JOB_FAILED]: 'Queue job failed for suggested activity',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_PROCESSING_FAILED]: 'Queue processing failed for suggested activity',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_CLEANUP_FAILED]: 'Queue cleanup failed for suggested activity',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_STATS_FAILED]: 'Queue statistics failed for suggested activity',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_ADD_JOB_FAILED]: 'Failed to add job to suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_ADD_CLEANUP_FAILED]: 'Failed to add cleanup job to suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_BULK_ADD_FAILED]: 'Failed to bulk add jobs to suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_GET_STATS_FAILED]: 'Failed to get queue statistics',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_CLEAR_FAILED]: 'Failed to clear suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_PAUSE_FAILED]: 'Failed to pause suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_QUEUE_RESUME_FAILED]: 'Failed to resume suggested activity queue',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_GENERATION_FAILED]: 'Cron job failed for activity generation',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_CLEANUP_FAILED]: 'Cron job failed for cleanup',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_SCHEDULING_FAILED]: 'Cron job scheduling failed',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_ALREADY_PROCESSING]: 'Suggested activity cron job is already processing',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_HEALTH_CHECK_FAILED]: 'Suggested activity cron health check failed',
  [ErrorCode.SUGGESTED_ACTIVITY_CRON_MANUAL_GENERATION_FAILED]: 'Manual suggested activity generation failed',
  [ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR]: 'ChatGPT API error',
  [ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_CONTENT_PARSE_FAILED]: 'Failed to parse ChatGPT content',
  [ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_PROMPT_BUILD_FAILED]: 'Failed to build ChatGPT prompt',

  // Email Module
  [ErrorCode.EMAIL_TEMPLATE_NOT_FOUND]: 'Email template not found',
  [ErrorCode.EMAIL_TEMPLATE_LOAD_FAILED]: 'Failed to load email template',
  [ErrorCode.EMAIL_TEMPLATE_RENDER_FAILED]: 'Failed to render email template',
  [ErrorCode.EMAIL_TEMPLATE_INVALID_FORMAT]: 'Email template has invalid format',
  [ErrorCode.EMAIL_TEMPLATE_VARIABLE_SUBSTITUTION_FAILED]: 'Failed to substitute variables in template',
  [ErrorCode.EMAIL_TEMPLATE_DIRECTORY_ACCESS_FAILED]: 'Failed to access template directory',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCode.EMAIL_INVALID_RECIPIENT]: 'Invalid email recipient',
  [ErrorCode.EMAIL_INVALID_SENDER]: 'Invalid email sender',
  [ErrorCode.EMAIL_ATTACHMENT_TOO_LARGE]: 'Email attachment is too large',
  [ErrorCode.EMAIL_RATE_LIMIT_EXCEEDED]: 'Email rate limit exceeded',
  [ErrorCode.EMAIL_SERVICE_UNAVAILABLE]: 'Email service is unavailable',
  [ErrorCode.EMAIL_QUOTA_EXCEEDED]: 'Email quota exceeded',
  [ErrorCode.EMAIL_CONFIGURATION_MISSING]: 'Email configuration is missing',
  [ErrorCode.EMAIL_FRONTEND_URL_NOT_SET]: 'Frontend URL is not set in configuration',
  [ErrorCode.EMAIL_SMTP_CONFIGURATION_INVALID]: 'SMTP configuration is invalid',
  [ErrorCode.EMAIL_TEMPLATE_DIRECTORY_NOT_FOUND]: 'Template directory not found',
  [ErrorCode.EMAIL_MAILER_SERVICE_UNAVAILABLE]: 'Mailer service is unavailable',
  [ErrorCode.EMAIL_INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.EMAIL_EMAIL_TOO_LONG]: 'Email address is too long',
  [ErrorCode.EMAIL_SUBJECT_TOO_LONG]: 'Email subject is too long',
  [ErrorCode.EMAIL_CONTENT_TOO_LARGE]: 'Email content is too large',
  [ErrorCode.EMAIL_SUSPICIOUS_CONTENT]: 'Email content appears suspicious',
  [ErrorCode.EMAIL_INTERNAL_SERVER_ERROR]: 'Internal email server error',
  [ErrorCode.EMAIL_TIMEOUT_ERROR]: 'Email operation timed out',
  [ErrorCode.EMAIL_UNKNOWN_ERROR]: 'Unknown email error occurred',

  // Firebase Module
  [ErrorCode.FIREBASE_INITIALIZATION_FAILED]: 'Firebase initialization failed',
  [ErrorCode.FIREBASE_CONFIGURATION_MISSING]: 'Firebase configuration is missing',
  [ErrorCode.FIREBASE_CONFIGURATION_INVALID]: 'Firebase configuration is invalid',
  [ErrorCode.FIREBASE_CREDENTIALS_INVALID]: 'Firebase credentials are invalid',
  [ErrorCode.FIREBASE_PROJECT_NOT_FOUND]: 'Firebase project not found',
  [ErrorCode.FIREBASE_SERVICE_ACCOUNT_ERROR]: 'Firebase service account error',
  [ErrorCode.FIREBASE_AUTH_FAILED]: 'Firebase authentication failed',
  [ErrorCode.FIREBASE_TOKEN_VERIFICATION_FAILED]: 'Firebase token verification failed',
  [ErrorCode.FIREBASE_TOKEN_EXPIRED]: 'Firebase token has expired',
  [ErrorCode.FIREBASE_TOKEN_INVALID]: 'Firebase token is invalid',
  [ErrorCode.FIREBASE_TOKEN_REVOKED]: 'Firebase token has been revoked',
  [ErrorCode.FIREBASE_TOKEN_MALFORMED]: 'Firebase token is malformed',
  [ErrorCode.FIREBASE_USER_NOT_FOUND]: 'Firebase user not found',
  [ErrorCode.FIREBASE_USER_DISABLED]: 'Firebase user is disabled',
  [ErrorCode.FIREBASE_USER_DELETED]: 'Firebase user has been deleted',
  [ErrorCode.FIREBASE_CUSTOM_TOKEN_CREATION_FAILED]: 'Failed to create Firebase custom token',
  [ErrorCode.FIREBASE_OPERATION_FAILED]: 'Firebase operation failed',
  [ErrorCode.FIREBASE_PERMISSION_DENIED]: 'Firebase permission denied',
  [ErrorCode.FIREBASE_QUOTA_EXCEEDED]: 'Firebase quota exceeded',
  [ErrorCode.FIREBASE_RATE_LIMIT_EXCEEDED]: 'Firebase rate limit exceeded',
  [ErrorCode.FIREBASE_TIMEOUT_ERROR]: 'Firebase operation timed out',
  [ErrorCode.FIREBASE_EXTERNAL_SERVICE_UNAVAILABLE]: 'Firebase external service unavailable',
  [ErrorCode.FIREBASE_NETWORK_ERROR]: 'Firebase network error',
  [ErrorCode.FIREBASE_API_ERROR]: 'Firebase API error',
  [ErrorCode.FIREBASE_SERVICE_UNAVAILABLE]: 'Firebase service unavailable',
  [ErrorCode.FIREBASE_INTERNAL_SERVER_ERROR]: 'Firebase internal server error',
  [ErrorCode.FIREBASE_UNKNOWN_ERROR]: 'Unknown Firebase error occurred',

  // Google Drive Module
  [ErrorCode.GOOGLE_DRIVE_CONNECTION_FAILED]: 'Google Drive connection failed',
  [ErrorCode.GOOGLE_DRIVE_FILE_NOT_FOUND]: 'Google Drive file not found',
  [ErrorCode.GOOGLE_DRIVE_UPLOAD_FAILED]: 'Google Drive upload failed',
  [ErrorCode.GOOGLE_DRIVE_DOWNLOAD_FAILED]: 'Google Drive download failed',
  [ErrorCode.GOOGLE_DRIVE_PERMISSION_DENIED]: 'Google Drive permission denied',
  [ErrorCode.GOOGLE_DRIVE_API_QUOTA_EXCEEDED]: 'Google Drive API quota exceeded',

  // Backup Module
  [ErrorCode.BACKUP_DATABASE_FAILED]: 'Database backup failed',
  [ErrorCode.BACKUP_UPLOAD_FAILED]: 'Failed to upload backup to Google Drive',
  [ErrorCode.BACKUP_DOWNLOAD_FAILED]: 'Failed to download backup from Google Drive',
  [ErrorCode.BACKUP_LIST_FAILED]: 'Failed to list backups from Google Drive',
  [ErrorCode.BACKUP_CREATION_AND_UPLOAD_FAILED]: 'Failed to create and upload backup',
  [ErrorCode.BACKUP_MYSQLDUMP_NOT_AVAILABLE]: 'mysqldump utility is not available',
  [ErrorCode.BACKUP_GOOGLE_DRIVE_UNAVAILABLE]: 'Google Drive service is not available',
  [ErrorCode.BACKUP_FOLDER_NOT_CONFIGURED]: 'Backup folder ID is not configured',
  [ErrorCode.BACKUP_FILE_NOT_FOUND]: 'Backup file not found',
  [ErrorCode.BACKUP_INVALID_FILE_ID]: 'Invalid backup file ID',
  [ErrorCode.BACKUP_RESTORE_FAILED]: 'Database restore from backup failed',

  // Common/System Errors
  [ErrorCode.COMMON_INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.COMMON_MISSING_REQUIRED_FIELDS]: 'Required fields are missing',
  [ErrorCode.COMMON_INVALID_FORMAT]: 'Invalid format provided',
  [ErrorCode.COMMON_VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.COMMON_DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ErrorCode.COMMON_DATABASE_QUERY_FAILED]: 'Database query failed',
  [ErrorCode.COMMON_DATABASE_TRANSACTION_FAILED]: 'Database transaction failed',
  [ErrorCode.COMMON_EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
  [ErrorCode.COMMON_API_RATE_LIMIT_EXCEEDED]: 'API rate limit exceeded',
  [ErrorCode.COMMON_NETWORK_ERROR]: 'Network error occurred',
  [ErrorCode.COMMON_INTERNAL_SERVER_ERROR]: 'Internal server error occurred',
  [ErrorCode.COMMON_SERVICE_UNAVAILABLE]: 'Service unavailable',
  [ErrorCode.COMMON_TIMEOUT_ERROR]: 'Operation timed out',
  [ErrorCode.COMMON_UNKNOWN_ERROR]: 'Unknown error occurred'
};

/**
 * Helper function to get error description by code
 */
export function getErrorDescription(code: ErrorCode): string {
  return ErrorDescription[code] || ErrorDescription[ErrorCode.COMMON_UNKNOWN_ERROR];
}

/**
 * Helper function to create error object with code and description
 */
export function createError(code: ErrorCode, customMessage?: string) {
  return {
    code,
    message: customMessage || getErrorDescription(code),
    description: getErrorDescription(code)
  };
}

/**
 * Get module name from error code
 */
export function getModuleFromErrorCode(code: ErrorCode): string {
  const codeNum = parseInt(code);
  
  if (codeNum >= 1000 && codeNum < 2000) return 'Admin';
  if (codeNum >= 2000 && codeNum < 3000) return 'Auth';
  if (codeNum >= 3000 && codeNum < 4000) return 'CLI';
  if (codeNum >= 4000 && codeNum < 5000) return 'Profile';
  if (codeNum >= 5000 && codeNum < 6000) return 'Suggested Activity';
  if (codeNum >= 6000 && codeNum < 7000) return 'Email';
  if (codeNum >= 7000 && codeNum < 8000) return 'Firebase';
  if (codeNum >= 8000 && codeNum < 8500) return 'Google Drive';
  if (codeNum >= 8500 && codeNum < 9000) return 'Backup';
  if (codeNum >= 9000 && codeNum < 10000) return 'Common/System';
  
  return 'Unknown';
}
