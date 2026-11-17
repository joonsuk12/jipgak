import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // 엔진은 순수 함수만: 현재 시각·네트워크 직접 호출 금지 (기준일은 asOf 인자로)
    files: ['packages/rules-engine/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Date.now() 금지: 기준일은 asOf 인자로 받습니다.',
        },
        {
          selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
          message: 'new Date() 금지: 기준일은 asOf 인자로 받습니다.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: '엔진에서 네트워크 호출 금지' },
        { name: 'window', message: '엔진에서 DOM 접근 금지' },
        { name: 'document', message: '엔진에서 DOM 접근 금지' },
        { name: 'localStorage', message: '엔진에서 플랫폼 API 접근 금지' },
      ],
    },
  },
  prettier,
);
