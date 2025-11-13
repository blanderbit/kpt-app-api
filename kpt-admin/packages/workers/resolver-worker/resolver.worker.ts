import { finishGlobalSpinner, startGlobalSpinner } from '../loading-worker';

import { resolverFunctions } from './resolver.functions';
import { VueResolver } from './vue.resolver';

declare const window: any;

const redirectToDomainByRole = (role?: string, fallbackPath?: string) => {
  const targetPath = fallbackPath || (role === 'admin' ? '/profile' : '/');

  if (window?.router) {
    window.router.push(targetPath);
    return;
  }

  if (typeof window !== 'undefined') {
    window.location.href = targetPath;
  }
};

export const routerAuthResolver = new VueResolver()
  .registerBeforeIntercept(startGlobalSpinner)
  .registerAfterIntercept(finishGlobalSpinner)
  .registerResolverFirstWorker(resolverFunctions.isUserAuthorized)
  .registerResolverFirstWorkerError(resolverFunctions.isAuthorizedError)
  .registerResolverSecondWorkerError(resolverFunctions.isResolveDataError);

export const routerResolverByLoginPage = routerAuthResolver.routeInterceptor(
  () => ({}),
  {
    beforeIntercept: ({ next }) => {
      startGlobalSpinner();

      if (typeof window !== 'undefined' && window.logout) {
        next(true);
        finishGlobalSpinner();
        window.logout = false;
        return 'stop';
      }
    },
    afterIntercept: ({ to, error }) => {
      finishGlobalSpinner();

      if (error !== 'FIRST_WORKER_ERROR') {
        redirectToDomainByRole(to?.meta?.role, to?.meta?.redirectPath);
      }
    },
    resolveFirstWorkerError: ({ next }) => {
      finishGlobalSpinner();

      if (typeof window !== 'undefined' && window.logout) {
        next(true);
        window.logout = false;
        return;
      }

      next('/login');
    },
  }
);
