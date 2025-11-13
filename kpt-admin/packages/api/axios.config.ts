import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenInterceptor, urlInterceptor, errorInterceptor, responseInterceptor } from './interceptors';

// Create axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptors
  instance.interceptors.request.use(
    (config) => {
      // Apply URL interceptor
      return urlInterceptor(config);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.request.use(
    (config) => {
      // Apply token interceptor
      return tokenInterceptor(config);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptors
  instance.interceptors.response.use(
    (response) => {
      // Automatically extract data from response
      return responseInterceptor(response);
    },
    (error) => {
      // Apply error interceptor
      return errorInterceptor(error);
    }
  );

  return instance;
};

// Export configured axios instance
export const apiClient = createAxiosInstance();

// Export axios for direct use if needed
export { axios };
export default apiClient;
