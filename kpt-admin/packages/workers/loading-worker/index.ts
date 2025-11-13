import { ref } from "vue";
import { createApp } from "vue";

import loader from "./Loader.vue";
import { LoaderManager } from "./loader.manager";

declare const window;

const isLoading = ref(false);
const LoaderManagerInstance = new LoaderManager();

let timeout;
const startGlobalSpinner = (): void => {
  window.clearTimeout(timeout);
  isLoading.value = true;
};

const finishGlobalSpinner = (): void => {
  window.clearTimeout(timeout);
  timeout = window.setTimeout(() => {
    isLoading.value = false;
  }, 300);
};

const createGlobalLoader = (): void => {
  window["loading"] = createApp(loader, {
    isLoading: isLoading,
    type: "global",
  })
  window["loading"].mount("#loading");
};

const asyncSpinnerByName = <T>(name: string) => {
  return async (...promises: Promise<unknown>[]): Promise<unknown> => {
    let results;
    startSpinnerByName(name);
    try {
      results = await Promise.all(promises);
    } catch (e) {
      console.error("[asyncSpinnerByName]: request error", e);
      finishSpinnerByName(name);
      finishGlobalSpinner();
      throw new Error(e);
    }
    finishSpinnerByName(name);
    return results;
  };
};

const asyncGlobalSpinner = async (
  ...promises: Promise<unknown>[]
): Promise<unknown> => {
  startGlobalSpinner();
  let results;
  try {
    results = await Promise.all(promises);
  } catch (e) {
    console.error("[asyncGlobalSpinner]: request error", e);
    finishGlobalSpinner();
    throw new Error(e);
  }
  finishGlobalSpinner();

  return results;
};

const startSpinnerByName = (name: string): void => {
  LoaderManagerInstance.startSpinnerByName(name);
};
const finishSpinnerByName = (name: string): void => {
  LoaderManagerInstance.finishSpinnerByName(name);
};

export {
  startGlobalSpinner,
  finishGlobalSpinner,
  createGlobalLoader,
  startSpinnerByName,
  finishSpinnerByName,
  asyncSpinnerByName,
  asyncGlobalSpinner,
  LoaderManagerInstance,
};
