import { AxiosError, AxiosResponse } from 'axios';
import { HttpStatus } from '../enums';
import { getStatusCode, getErrorInfo, getErrorMessage, isStatus, isNetworkError, logError } from '../utils/status-codes';
import { showErrorToast, showWarningToast } from '@workers/toast-worker';

declare const window: any;

export const errorInterceptor = (
  error: AxiosError
): Promise<AxiosResponse> => {
  // Log detailed error information
  logError(error, 'Error Interceptor');
  
  // Get error information
  const statusCode = getStatusCode(error);
  const errorInfo = getErrorInfo(error);
  const readableMessage = getErrorMessage(error) || errorInfo.message;

  if (isStatus(error, HttpStatus.UNAUTHORIZED)) {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = typeof requestUrl === 'string' && (requestUrl === '/admin/login' || requestUrl.endsWith('/admin/login'));

    if (!isLoginRequest) {
      console.log('401 Unauthorized - clearing token');
      showWarningToast('Сессия истекла. Пожалуйста, войдите снова.');
      localStorage.removeItem('auth_token');

      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        console.log('Redirecting to login');
        if (window.router) {
          window.router.push('/login');
        } else {
          window.location.href = '/login';
        }
      }
    } else {
      // 401 с POST /admin/login: показываем сообщение от бэкенда (разные причины — неверные данные, email не верифицирован и т.д.)
      const loginMessage =
        errorInfo.message && errorInfo.message !== 'Unknown error occurred'
          ? errorInfo.message
          : 'Неверный email или пароль.';
      showWarningToast(loginMessage);
    }

    return Promise.reject(errorInfo);
  }

  // Handle 403 Forbidden
  if (isStatus(error, HttpStatus.FORBIDDEN)) {
    console.error('403 Forbidden:', errorInfo.data);
    showErrorToast(errorInfo.message || 'Недостаточно прав для выполнения действия.');
    return Promise.reject(errorInfo);
  }

  // Handle 404 Not Found
  if (isStatus(error, HttpStatus.NOT_FOUND)) {
    console.error('404 Not Found:', errorInfo.data);
    showWarningToast(errorInfo.message || 'Ресурс не найден.');
    return Promise.reject(errorInfo);
  }

  // Handle 500 Internal Server Error
  if (isStatus(error, HttpStatus.INTERNAL_SERVER_ERROR)) {
    console.error('500 Internal Server Error:', errorInfo.data);
    showErrorToast('Произошла внутренняя ошибка сервера. Попробуйте позже.');
    
    // You can emit an event or show a notification here
    // DetectionBus.emit('error', { ... });
    
    return Promise.reject(errorInfo);
  }

  // Handle 422 Validation Error
  if (isStatus(error, 422)) {
    console.error('422 Validation Error:', errorInfo.data);
    showErrorToast(errorInfo.message || 'Проверьте корректность введённых данных.');
    
    // You can emit validation errors here
    // DetectionBus.emit('error', { ... });
    
    return Promise.reject(errorInfo);
  }

  // Handle network errors (no response)
  if (isNetworkError(error)) {
    console.error('Network Error:', error.message);
    showErrorToast('Не удалось подключиться к серверу. Проверьте соединение.');
    
    return Promise.reject({
      status: 0,
      statusText: 'Network Error',
      data: null,
      message: error.message || 'Network connection failed'
    });
  }

  // Handle other HTTP errors
  console.error('API Error:', errorInfo);
  showErrorToast(readableMessage);

  return Promise.reject(errorInfo);
};
