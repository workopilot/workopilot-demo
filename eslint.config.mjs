// @ts-check

import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.vue'],
    rules: {
      'vue/html-closing-bracket-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    files: ['apps/web-antd/src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: 'apps/web-antd/tsconfig.json',
      },
    },
  },
]);
