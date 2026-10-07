import eslintConfigPrettier from 'eslint-config-prettier/flat'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['.nuxt/**', '.output/**', 'dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
    },
  },
  eslintConfigPrettier,
)
