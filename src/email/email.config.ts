export const emailServiceConfig = {
  frontendUrl: process.env.FRONTEND_URL,
  appName: process.env.APP_NAME || 'KPT App',
};

export enum EmailSubject {
  VERIFICATION = 'Email Verification - KPT App',
  PASSWORD_RESET = 'Password Reset - KPT App',
  EMAIL_CHANGE_CONFIRMATION = 'Email Change Confirmation - KPT App',
}
