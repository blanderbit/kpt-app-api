import type { App } from 'vue'
import { toast, type ToastOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const defaultOptions: ToastOptions = {
  position: toast.POSITION.TOP_RIGHT,
  autoClose: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
  theme: 'colored',
}

let globalOptions: ToastOptions = { ...defaultOptions }

const getOptions = (options?: ToastOptions): ToastOptions => ({
  ...globalOptions,
  ...(options ?? {}),
})

export const registerToastPlugin = (app: App, options?: ToastOptions): void => {
  app.config.globalProperties.$toast = toast
  if (options) {
    globalOptions = getOptions(options)
  }
}

export const showSuccessToast = (message: string, options?: ToastOptions): void => {
  toast.success(message, getOptions(options))
}

export const showErrorToast = (message: string, options?: ToastOptions): void => {
  toast.error(message, getOptions(options))
}

export const showWarningToast = (message: string, options?: ToastOptions): void => {
  toast.warning(message, getOptions(options))
}



