/**
 *
 *  METHOD_HOOK_ENUM
 *
 *  definition - constant for specifying standard resolver methods
 *
 *  usage - for registering a method in the resolver and for calling functions
 *
 *  @const {{
 *      RESOLVER_FIRST_WORKER: string,
 *      RESOLVER_SECOND_WORKER: string,
 *      RESOLVER_FIRST_WORKER_ERROR: string,
 *      AFTER_INTERCEPT: string,
 *      BEFORE_INTERCEPT: string,
 *      RESOLVER_SECOND_WORKER_ERROR: string
 *  }}
 *
 */

const METHOD_HOOK_ENUM = {
  BEFORE_INTERCEPT: '_beforeIntercept',
  AFTER_INTERCEPT: '_afterIntercept',
  RESOLVER_FIRST_WORKER: '_resolverFirstWorker',
  RESOLVER_SECOND_WORKER: '_resolverSecondWorker',
  RESOLVER_FIRST_WORKER_ERROR: '_resolverFirstWorkerError',
  RESOLVER_SECOND_WORKER_ERROR: '_resolverSecondWorkerError',
};

/**
 *
 *  @const {{
 *      OBJECT: string,
 *      FUNCTION: string,
 *      BOOLEAN: string
 *  }}
 *
 */

const JS_TYPES_ENUM = {
  OBJECT: 'object',
  FUNCTION: 'function',
  BOOLEAN: 'boolean',
};

/**
 *
 *  checkIfExistType
 *
 *  definition - the checked parameter, exception and type are accepted,
 *               if the checked parameters do not match the type, then
 *               the exception will work
 *
 *  usage - used by 2 functions isObject and isFunction
 *
 *  @example
 *
 *  checkIfExistType(1, '2', 'string')
 *  // returns '2'
 *
 *  @example
 *
 *  checkIfExistType(1, 2, 'number')
 *  // returns 1
 *
 *  @template varA
 *  @template varB
 *
 *  @param { * } varA - can be any kind of data that will be checked
 *                      for the type passed by the "type" parameter
 *  @param { * } varB - can be any kind of data that will return as exception
 *  @param { string } type
 *  @return {(varA | varB)}
 */

const checkIfExistType = (varA, varB, type) =>
  typeof varA === type ? varA : varB;

/**
 *  isObject
 *
 *  definition - works exactly like checkIfExistType only more
 *               specifically for checking for type "object",
 *               will check the first parameter for an object and
 *               return it if it is an object or return an exception
 *
 *  usage - used to check for an object, in the default
 *          function to generate parallel requests and custom function
 *
 *  @example
 *
 *
 *
 *  @template varA
 *  @template varB
 *
 *  @param { * } varA - can be any kind of data that will be checked
 *                      for the type passed by the type
 *  @param { * } varB - can be any kind of data that will return as exception
 *  @return {(varA | varB)}
 */

const isObject = (varA, varB) =>
  checkIfExistType(varA, varB, JS_TYPES_ENUM.OBJECT);

/**
 *  isFunction
 *
 *  definition - works exactly like checkIfExistType only more
 *               specifically for checking for type "function"
 *
 *  usage - used to check that the input parameter is a function,
 *          since the corresponding call is made after that;
 *          that is, this was done so that if a custom parameter
 *          is passed, then it will work or the default implementation
 *
 *  @example
 *
 *  isFunction(
 *      () => {},
 *      () => Promise.resolve(),
 *  )()
 *
 *  // returns first param () => {}
 *
 *  @template varA
 *  @template varB
 *
 *  @param { * } varA - can be any kind of data that will be checked
 *                      for the type passed by the type
 *  @param { * } varB - can be any kind of data that will return as exception
 *  @return {(varA | varB)}
 */

const isFunction = (varA, varB) =>
  checkIfExistType(varA, varB, JS_TYPES_ENUM.FUNCTION);

/**
 *  VueResolver
 *
 *  definition - creates methods, hooks, properties designed to control the
 *               intermediate moment of transition through routing vue.js
 *
 *  usage - used only in vue.js, namely in the beforeEnter router hook
 *
 */

export class VueResolver {
  /**
   *
   *  _defFunction
   *
   *  definition - is intended to set the default value
   *               of the method to be registered
   *
   *  usage - used in places where it will call a synchronous call
   *
   *  @template ret
   *
   *  @param ret
   *  @return {(ret | {})}
   *  @private
   */

  _defFunction = (ret) => (ret ? ret : {});

  /**
   *
   *  _defFunctionPromise
   *
   *  definition - is intended to set the default value of
   *               the method to be registered
   *
   *  usage - used in places where it will async call
   *
   *  @return {Promise<boolean>}
   *  @private
   */

  _defFunctionPromise = () => Promise.resolve(true);

  /**
   *
   *  _beforeIntercept
   *
   *  definition - the hook is launched at the very
   *               beginning of resolver processing
   *
   *  usage - usually used to launch a spinner
   *
   *  @type {function(*): {}}
   *  @private
   */

  _beforeIntercept = this._defFunction;

  /**
   *
   *  _afterIntercept
   *
   *  definition - the hook starts at the very end of the resolver
   *
   *  usage - usually used to hide a spinner
   *
   *  @type {function(*): {}}
   *  @private
   */

  _afterIntercept = this._defFunction;

  /**
   *
   *  _resolverFirstWorker
   *
   *  definition - hook is used to make the 1st level of
   *               verification before the transition stage
   *
   *  usage - used mainly to get a user and check for login,
   *          but if this system is not needed then it is disabled by default
   *
   *  @type {function(): Promise<boolean>}
   *  @private
   */

  _resolverFirstWorker = this._defFunctionPromise;

  /**
   *
   * _resolverSecondWorker
   *
   *  definition - hook is used to make the 2nd level of data retrieval,
   *               by default the standard function for parallel data retrieval is used
   *
   *  usage - used to receive data in parallel,
   *          requests are defined in the callback itself
   *
   *  @type {function(*=)}
   *  @private
   */

  _resolverSecondWorker = this._defaultSecondWorker;

  /**
   *
   * _resolverFirstWorkerError
   *
   *  definition - an error handler if we got false during the first step of the check
   *
   *  usage - used as a rule to check that the user is logged
   *          in or not, if not, then you can take the appropriate action
   *
   * @type {function(*): {}}
   * @private
   */

  _resolverFirstWorkerError = this._defFunction;

  /**
   *
   *  _resolverFirstWorkerError
   *
   *  definition - error handler when receiving data
   *
   *  usage - used as a rule to check that there is some problem in receiving data
   *
   * @type {function(*): {}}
   * @private
   */

  _resolverSecondWorkerError = this._defFunction;

  /**
   *  This callback type is called `requestCallback` and is displayed as a global symbol.
   *
   *  @callback resolverCallback
   *  @param { object } to - object for "to" route
   *  @param { object } from - object for "from" route
   *
   *  @return { Object } object of functions method which return promise
   */

  /**
   *
   *  routeInterceptor
   *
   *  definition - function handler, with the implementation of
   *               the hooks of the interceptor's life, is made to intercept the moment
   *               of transition on the page, with the possibility of receiving data
   *               and flexible management of the authorization system
   *
   *  usage - used as a rule in cases of receiving data
   *          before going to the page, all data is
   *          requested in parallel, combining such images
   *
   *          loader. displaying errors,
   *          receiving data, checking for a logged in user
   *
   *  @param resolverCallback { function }
   *  @param customFunctions {{
   *      resolverSecondWorker: undefined | function,
   *      resolveFirstWorkerError: undefined | function,
   *      beforeIntercept: undefined | function,
   *      afterIntercept: undefined | function,
   *      resolveSecondWorkerError: undefined | function
   *  }} check resolver methods, its the same but for custom usage, not for global
   *
   *  @return { Function | Promise }
   */

  routeInterceptor(resolverCallback?, customFunctions?) {
    customFunctions = isObject(customFunctions, {});

    const {
      resolverSecondWorker,
      resolverFirstWorker,
      resolveFirstWorkerError,
      beforeIntercept,
      afterIntercept,
      resolveSecondWorkerError,
    } = customFunctions;

    return async (to, from, nextStandard) => {
      let calledNext = false;
      const next = (...e) => {
        // TODO will be great move it before this function
        if (!calledNext) {
          nextStandard(...e);
          calledNext = true;
        }
      };

      const standardDataParams = {
        to,
        from,
      };

      const standardDataParamsWithNext = {
        ...standardDataParams,
        next,
      };

      const result = isFunction(
        beforeIntercept,
        this[METHOD_HOOK_ENUM.BEFORE_INTERCEPT]
      )(standardDataParamsWithNext);

      if(result === 'stop') {
        isFunction(
          afterIntercept,
          this[METHOD_HOOK_ENUM.AFTER_INTERCEPT]
        )({
          ...standardDataParamsWithNext,
          error: 'FIRST_WORKER_ERROR'
        });
        return
      }

      const resultAsyncCheck = await isFunction(
        resolverFirstWorker,
        this[METHOD_HOOK_ENUM.RESOLVER_FIRST_WORKER]
      )(standardDataParamsWithNext);

      if (
        typeof resultAsyncCheck !== JS_TYPES_ENUM.BOOLEAN ||
        !resultAsyncCheck
      ) {
        const firstWorkerError = {
          ...standardDataParamsWithNext,
          error: 'FIRST_WORKER_ERROR',
        };
        isFunction(
          resolveFirstWorkerError,
          this[METHOD_HOOK_ENUM.RESOLVER_FIRST_WORKER_ERROR]
        )(firstWorkerError);

        isFunction(
          afterIntercept,
          this[METHOD_HOOK_ENUM.AFTER_INTERCEPT]
        )(firstWorkerError);

        return next(false);
      }

      if (typeof resolverCallback === JS_TYPES_ENUM.FUNCTION) {
        try {
          let objRequests = resolverCallback(to, from);

          objRequests = isObject(objRequests, {});

          const result = await isFunction(
            resolverSecondWorker,
            this[METHOD_HOOK_ENUM.RESOLVER_SECOND_WORKER]
          )(objRequests);

          Object.keys(result).forEach((item) => (to.meta[item] = result[item]));
        } catch (error) {
          const paramsWithError = {
            ...standardDataParams,
            error: 'SECOND_WORKER_ERROR',
            errorDetails: error,
          };

          isFunction(
            resolveSecondWorkerError,
            this[METHOD_HOOK_ENUM.RESOLVER_SECOND_WORKER_ERROR]
          )(paramsWithError);

          isFunction(
            afterIntercept,
            this[METHOD_HOOK_ENUM.AFTER_INTERCEPT]
          )(paramsWithError);

          return next(false);
        }
      }

      isFunction(
        afterIntercept,
        this[METHOD_HOOK_ENUM.AFTER_INTERCEPT]
      )(standardDataParamsWithNext);

      window.scrollTo(0, 0)
      return next(true);
    };
  }

  /**
   *  _defaultSecondWorker
   *
   *  definition - and gets a function object, where each
   *               function returns a promise, done in order to
   *               make parallel requests and return a response object
   *
   *  usage - check definition
   *
   *  @param objRequests
   *  @return {Promise<void>}
   *  @private
   */

  async _defaultSecondWorker(objRequests) {
    const objData = {};
    const arrayRequests = Object.keys(objRequests).map((key, index) => {
      objData[index] = key;
      return typeof objRequests[key] === JS_TYPES_ENUM.FUNCTION
        ? objRequests[key]()
        : Promise.resolve(null);
    });

    let result = [];

    result = await Promise.all(arrayRequests);

    Object.keys(objData).forEach((i) => {
      objData[objData[i]] = result[i];
      delete objData[i];
    });

    return objData;
  }

  /**
   *
   *  registerBeforeIntercept
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerBeforeIntercept(fn) {
    return this.registerMethod(METHOD_HOOK_ENUM.BEFORE_INTERCEPT, fn);
  }

  /**
   *  registerAfterIntercept
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerAfterIntercept(fn) {
    return this.registerMethod(METHOD_HOOK_ENUM.AFTER_INTERCEPT, fn);
  }

  /**
   *
   *  registerResolverFirstWorker
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerResolverFirstWorker(fn) {
    return this.registerMethod(METHOD_HOOK_ENUM.RESOLVER_FIRST_WORKER, fn);
  }

  /**
   *
   *  registerResolverSecondWorker
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerResolverSecondWorker(fn) {
    return this.registerMethod(METHOD_HOOK_ENUM.RESOLVER_SECOND_WORKER, fn);
  }

  /**
   *
   *  registerResolverFirstWorkerError
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerResolverFirstWorkerError(fn) {
    return this.registerMethod(
      METHOD_HOOK_ENUM.RESOLVER_FIRST_WORKER_ERROR,
      fn
    );
  }

  /**
   *
   *  registerResolverSecondWorkerError
   *
   *  definition - function registration
   *
   *  @param fn
   *  @return {*}
   */

  registerResolverSecondWorkerError(fn) {
    return this.registerMethod(
      METHOD_HOOK_ENUM.RESOLVER_SECOND_WORKER_ERROR,
      fn
    );
  }

  /**
   *  registerMethod
   *
   *  definition - reusable function, which takes the name of
   *               the method and the callback, thereby reassigning
   *               the default execution
   *
   *  usage - used to register different methods
   *
   *  @param name
   *  @param callBack
   *  @return {VueResolver}
   */

  registerMethod(name, callBack) {

    if (typeof callBack !== JS_TYPES_ENUM.FUNCTION || !name) {
      return this;
    }

    this[name] = callBack;

    return this;
  }
}
