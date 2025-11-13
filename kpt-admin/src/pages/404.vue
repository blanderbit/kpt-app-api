<template>
  <v-container class="error-page" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-8" elevation="12">
          <v-card-text class="text-center">
            <h1 class="display-1 font-weight-bold mb-4">404</h1>
            <p class="text-subtitle-1 mb-6">
              Sorry, the page you are looking for does not exist or may have been moved.
            </p>
            <div class="d-flex flex-column flex-sm-row justify-center ga-4">
              <v-btn color="primary" size="large" @click="goHome">
                Go to Dashboard
              </v-btn>
              <v-btn variant="outlined" size="large" @click="goBack">
                Go Back
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/profile')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}
</script>

<route lang="yaml">
name: not-found
meta:
  layout: login
</route>

<style scoped>
.error-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%);
  display: flex;
  align-items: center;
}

h1 {
  font-size: clamp(3rem, 10vw, 6rem);
  color: #1a237e;
}

p {
  color: #424242;
}
</style>

