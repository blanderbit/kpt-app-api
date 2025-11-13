import { AxiosError } from 'axios';
import { HttpStatus } from '../enums';

export interface ErrorInfo {
  status: number;
  statusText: string;
  message: string;
  data?: any;
}

/**
 * Extract status code from axios error
 */
export const getStatusCode = (error: AxiosError): number => {
  return error.response?.status || error.code || 0;
};

/**
 * Extract error information from axios error
 */
export const getErrorInfo = (error: AxiosError): ErrorInfo => {
  const status = getStatusCode(error);
  const statusText = error.response?.statusText || 'Unknown Error';
  const data = error.response?.data;
  
  let message = 'Unknown error occurred';
  
  if (data?.message) {
    message = data.message;
  } else if (data?.error?.details) {
    message = data.error.details;
  } else if (error.message) {
    message = error.message;
  }
  
  return {
    status,
    statusText,
    message,
    data
  };
};

/**
 * Check if error is a specific HTTP status
 */
export const isStatus = (error: AxiosError, status: number): boolean => {
  return getStatusCode(error) === status;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: AxiosError): boolean => {
  const status = getStatusCode(error);
  return status >= 400 && status < 500;
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: AxiosError): boolean => {
  const status = getStatusCode(error);
  return status >= 500 && status < 600;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && error.request;
};

/**
 * Get human-readable error message based on status code
 */
export const getErrorMessage = (error: AxiosError): string => {
  const status = getStatusCode(error);
  
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return 'You are not authorized to access this resource';
    case HttpStatus.FORBIDDEN:
      return 'Access to this resource is forbidden';
    case HttpStatus.NOT_FOUND:
      return 'The requested resource was not found';
    case HttpStatus.BAD_REQUEST:
      return 'Invalid request data';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'Internal server error occurred';
    case 0:
      return 'Network connection failed';
    default:
      return error.message || 'An unexpected error occurred';
  }
};

/**
 * Log error with detailed information
 */
export const logError = (error: AxiosError, context?: string): void => {
  const errorInfo = getErrorInfo(error);
  
  console.group(`❌ API Error${context ? ` (${context})` : ''}`);
  console.log('Status:', errorInfo.status);
  console.log('Status Text:', errorInfo.statusText);
  console.log('Message:', errorInfo.message);
  console.log('Data:', errorInfo.data);
  console.log('Config:', error.config);
  console.groupEnd();
};
