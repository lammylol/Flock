const eslintPluginReactNative = require('eslint-plugin-react-native');
const eslintPluginReactHooks = require('eslint-plugin-react-hooks');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintPluginTypeScript = require('@typescript-eslint/eslint-plugin');
const eslintParserTypeScript = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules', 'dist', 'build', 'ios', 'android', '**/*.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypeScript,
      'react-native': eslintPluginReactNative,
      'react-hooks': eslintPluginReactHooks,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules,
      ...eslintPluginReactNative.configs.all.rules,
      ...prettierConfig.rules,

      quotes: ['error', 'single'],
      'prettier/prettier': ['error', { singleQuote: true }],
      'react-hooks/exhaustive-deps': 'warn',
      // Added this rule configuration
      'react-native/no-raw-text': [
        'error',
        {
          skip: ['ThemedText'],
        },
      ],
    },
  },
];
