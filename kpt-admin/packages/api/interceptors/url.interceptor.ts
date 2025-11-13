import { InternalAxiosRequestConfig } from 'axios'

const AXIOS_BASE_URL = import.meta.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

export const urlInterceptor = (
  request: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  // Only add base URL if the request URL doesn't start with http
  if (!request.url?.startsWith('http')) {
    request.url = `${AXIOS_BASE_URL}${request.url}`;
  }

  return request;
};
