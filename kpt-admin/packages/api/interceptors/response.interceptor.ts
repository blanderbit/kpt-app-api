import { AxiosResponse } from 'axios';

/**
 * Response interceptor to automatically extract data from response
 */
export const responseInterceptor = (response: AxiosResponse): any => {
  // Return only data, not the whole response object
  return response.data;
};

