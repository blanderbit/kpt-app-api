<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>KPT Admin Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert v-if="errorMessage" type="error" density="compact" class="mb-3" closable>
              {{ errorMessage }}
            </v-alert>
            <v-form ref="formRef" @submit.prevent>
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
                :rules="emailRules"
                @keyup.enter="login"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
                :rules="passwordRules"
                @keyup.enter="login"
              ></v-text-field>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="login" type="button" :loading="loading">
                  Login
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@api'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters'
]

const login = async () => {
  if (!email.value || !password.value) return

  errorMessage.value = ''
  loading.value = true
  try {
    const response = await authService.login({
      email: email.value,
      password: password.value
    })

    const token = response?.accessToken ?? (response as any)?.data?.accessToken
    if (!token) {
      console.error('Login response missing accessToken', response)
      errorMessage.value = 'Неверный ответ сервера. Попробуйте снова.'
      return
    }

    localStorage.setItem('auth_token', token)

    const fromQuery =
      typeof route.query?.redirect === 'string' &&
      route.query.redirect.startsWith('/') &&
      route.query.redirect !== '/login'
        ? route.query.redirect
        : null
    const redirectPath = fromQuery ?? (route.meta?.redirectPath as string) ?? '/profile'
    try {
      await router.replace(redirectPath)
    } catch (_) {
      window.location.assign(redirectPath)
    }
  } catch (error: any) {
    console.error('Login error:', error)
    const msg = error?.message || error?.data?.message
    errorMessage.value = msg || 'Ошибка входа. Проверьте email и пароль.'
  } finally {
    loading.value = false
  }
}
</script>

<route lang="yaml">
name: login
meta:
  layout: login
  redirectPath: /profile
  role: admin
</route>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>
