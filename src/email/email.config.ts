export const emailServiceConfig = {
  /**
   * Базовый URL, по которому доступны статики (картинки для писем).
   * Рекомендуется выставить PUBLIC_URL или BACKEND_URL, например:
   * https://api.plesury.com
   */
  publicBaseUrl: process.env.PUBLIC_URL || process.env.BACKEND_URL || process.env.FRONTEND_URL || '',
  appName: process.env.APP_NAME || 'KPT App',
};

export enum EmailSubject {
  VERIFICATION = 'Email Verification - KPT App',
  PASSWORD_RESET = 'Password Reset - KPT App',
  EMAIL_CHANGE_CONFIRMATION = 'Email Change Confirmation - KPT App',
}
