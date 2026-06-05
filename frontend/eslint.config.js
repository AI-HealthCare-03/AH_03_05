const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // TypeScript 권장 (eslint:recommended 대체 포함)
  tsPlugin.configs['flat/eslint-recommended'],
  ...tsPlugin.configs['flat/recommended'],

  // React JSX transform (React 17+, import React 불필요)
  reactPlugin.configs.flat['jsx-runtime'],

  // React Hooks (rules-of-hooks + exhaustive-deps만 적용, Compiler 규칙 제외)
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // 전체 파일 설정
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier 통합
      'prettier/prettier': 'warn',

      // any 타입 경고
      '@typescript-eslint/no-explicit-any': 'warn',

      // 미사용 변수 경고 (언더스코어 접두사 허용)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // console.error·warn만 허용
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // TypeScript 관련 완화
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },

  // Prettier 규칙 충돌 제거 (마지막에 위치해야 함)
  prettierConfig,

  // 제외 경로
  {
    ignores: ['node_modules/', 'dist/', '.expo/', 'babel.config.js', 'metro.config.js', 'eslint.config.js'],
  },
];
