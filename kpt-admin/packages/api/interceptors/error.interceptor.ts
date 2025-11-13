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
    console.log('401 Unauthorized - clearing token');
    showWarningToast('Сессия истекла. Пожалуйста, войдите снова.');
    // Clear token
    localStorage.removeItem('auth_token');
    
    // Only redirect if we're not already on the login page
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      console.log('Redirecting to login');
      // Use Vue Router if available, otherwise fallback to window.location
      if (window.router) {
        window.router.push('/login');
      } else {
        window.location.href = '/login';
      }
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
