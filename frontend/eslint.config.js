import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // components/archive: 표준화 전 기록 (고치지 않는 코드라 검사하지 않음, README 참고)
  globalIgnores(['dist', 'src/components/archive/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // 기록용(archive) 모듈은 샘플 페이지의 기록 탭만 쓴다. 화면 · 표준 부품 · 표준 카탈로그에서 import하면 오류
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/components/sample/Sample.jsx', 'src/components/sample/catalog/archive/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/archive/**'],
          message: '기록용(archive) 모듈입니다. 표준 UI(common/ui · src/styles)를 쓰세요. 대응표: src/components/archive/README.md',
        }],
      }],
    },
  },
])
