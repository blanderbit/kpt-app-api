import { finishGlobalSpinner, startGlobalSpinner } from '../loading-worker';

import { resolverFunctions } from './resolver.functions';
import { VueResolver } from './vue.resolver';

declare const window: any;

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
        window.logout = true;
        return 'stop';
      }
    },
    afterIntercept: ({ to, error, next }) => {
      finishGlobalSpinner();
      if (!error) {
        next('/profile')
      }
    },
    resolveFirstWorkerError: ({ next }) => {
      debugger
      finishGlobalSpinner();

      if (typeof window !== 'undefined' && window.logout) {
        next(true);
        window.logout = true;
        return;
      }

      next('/login');
    },
  }
);
