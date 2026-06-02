module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    // Prettier 통합
    'prettier/prettier': 'warn',

    // any 타입 경고
    '@typescript-eslint/no-explicit-any': 'warn',

    // 미사용 변수 경고 (TypeScript 버전 사용, 언더스코어 접두사 허용)
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // console.error는 허용, 나머지 warn
    'no-console': ['warn', { allow: ['error', 'warn'] }],

    // React 17+ JSX transform 사용 (import React 불필요)
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',

    // TypeScript 관련 완화
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'babel.config.js', 'metro.config.js'],
};
