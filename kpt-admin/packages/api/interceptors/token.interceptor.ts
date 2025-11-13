import { InternalAxiosRequestConfig } from "axios";

export const tokenInterceptor = (
  request: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  // Get token from localStorage or wherever you store it
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  
  return request;
};
