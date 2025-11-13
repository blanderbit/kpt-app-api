import { AxiosError } from 'axios';
import { 
  getStatusCode, 
  getErrorInfo, 
  isStatus, 
  isClientError, 
  isServerError, 
  isNetworkError,
  getErrorMessage,
  logError 
} from '../utils/status-codes';
import { HttpStatus } from '../enums';

// Example: Handling errors in Vue components
export const handleApiError = (error: AxiosError, context?: string) => {
  // Log error with context
  logError(error, context);
  
  // Get detailed error information
  const errorInfo = getErrorInfo(error);
  const statusCode = getStatusCode(error);
  
  // Handle different types of errors
  if (isStatus(error, HttpStatus.UNAUTHORIZED)) {
    // Handle 401 - redirect to login
    console.log('User needs to login');
    return { type: 'auth', message: 'Please login to continue' };
  }
  
  if (isStatus(error, HttpStatus.FORBIDDEN)) {
    // Handle 403 - access denied
    console.log('Access denied');
    return { type: 'permission', message: 'You do not have permission to access this resource' };
  }
  
  if (isStatus(error, HttpStatus.NOT_FOUND)) {
    // Handle 404 - resource not found
    console.log('Resource not found');
    return { type: 'not_found', message: 'The requested resource was not found' };
  }
  
  if (isClientError(error)) {
    // Handle 4xx errors - client errors
    console.log('Client error:', errorInfo.message);
    return { type: 'client_error', message: errorInfo.message };
  }
  
  if (isServerError(error)) {
    // Handle 5xx errors - server errors
    console.log('Server error:', errorInfo.message);
    return { type: 'server_error', message: 'Server error occurred. Please try again later.' };
  }
  
  if (isNetworkError(error)) {
    // Handle network errors
    console.log('Network error:', error.message);
    return { type: 'network', message: 'Network connection failed. Please check your internet connection.' };
  }
  
  // Handle other errors
  console.log('Unknown error:', errorInfo);
  return { type: 'unknown', message: getErrorMessage(error) };
};

// Example: Using in Vue component
export const useApiErrorHandling = () => {
  const handleError = (error: AxiosError, context?: string) => {
    const errorResult = handleApiError(error, context);
    
    // You can emit events, show notifications, etc.
    // this.$emit('error', errorResult);
    // this.$toast.error(errorResult.message);
    
    return errorResult;
  };
  
  return { handleError };
};

// Example: Status code checking
export const checkResponseStatus = (error: AxiosError) => {
  const status = getStatusCode(error);
  
  switch (status) {
    case HttpStatus.OK:
      return 'Success';
    case HttpStatus.CREATED:
      return 'Created successfully';
    case HttpStatus.BAD_REQUEST:
      return 'Bad request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not found';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'Internal server error';
    default:
      return `HTTP ${status}`;
  }
};
