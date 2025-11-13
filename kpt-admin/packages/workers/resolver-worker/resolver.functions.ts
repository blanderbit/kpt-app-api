import { ref } from "vue";
import { finishGlobalSpinner } from "../loading-worker";
import { authService } from "../../api";

declare const window: any;

if (typeof window !== 'undefined' && typeof window.logout === 'undefined') {
  window.logout = false;
}

const roleProfileName = ref(null);

const _checkAsyncIsUser = async (to) => {
  try {
    const response = await authService.getMe();
    to.meta.user = response;
    if (typeof window !== 'undefined') {
      window.logout = false;
    }
    return true;
  } catch (e) {
    console.log('Auth check error:', e)
    window.logout = true;
    
    // Check status code from axios error
    const statusCode = e.status || e.response?.status || e.code;
    
    if (statusCode === 401) {
      console.log('401 Unauthorized - redirecting to login');
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        // Redirect to login using Vue Router
        if (window.router) {
          window.router.push('/login');
        } else {
          // Fallback to window location if router not available
          window.location.href = '/login';
        }
      }
    } else if (statusCode === 403) {
      console.log('403 Forbidden - access denied');
      // Handle forbidden access
      if (window.router) {
        window.router.push('/forbidden');
      }
    } else if (statusCode === 0) {
      console.log('Network error - no connection');
      // Handle network errors
    } else {
      console.log(`HTTP Error ${statusCode}:`, e.message || 'Unknown error');
    }
    
    return false;
  }
};

const isUserAuthorized = async ({ to }) => {
  return _checkAsyncIsUser(to);
}

const isAuthorizedError = ({ to, next }) => {
  finishGlobalSpinner();
  next(false);
};

const isResolveDataError = async (error) => {
  if (error.errorDetails.code === 404) {
    window.location.href = '/404';

    finishGlobalSpinner();
  }
};

export const resolverFunctions = {
  isUserAuthorized,
  isAuthorizedError,
  isResolveDataError,
};
