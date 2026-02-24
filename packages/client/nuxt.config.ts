import { defineNuxtConfig } from 'nuxt/config'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/scss/common.scss'],
  devServer: {
    port: 33000,
  },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:33010', // Your NestJS server URL
      tmdbApiKey: '',
      rawgApiKey: '',
    },
  },
  app: {
    head: {
      title: 'Watched - Game Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Track and manage your game collection' },
      ],
    },
  },
  nitro: {
    compatibilityDate: '2026-01-01',
  },
})
