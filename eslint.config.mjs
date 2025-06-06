import {defineConfig, globalIgnores} from 'eslint/config';
import preferArrow from 'eslint-plugin-prefer-arrow';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    // globalIgnores(['projects/**/*']),
    {
        files: ['**/*.ts'],

        extends: compat.extends(
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:@angular-eslint/recommended',
            'plugin:@angular-eslint/template/process-inline-templates',
            'plugin:prettier/recommended', // <--- here we inherit from the recommended setup from eslint-plugin-prettier for TS
        ),

        plugins: {
            'prefer-arrow': preferArrow,
        },

        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',

            parserOptions: {
                project: ['tsconfig.json', 'e2e/tsconfig.json'],
                createDefaultProgram: true,
            },
        },

        rules: {
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'geoengine',
                    style: 'kebab-case',
                },
            ],

            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'geoengine',
                    style: 'camelCase',
                },
            ],

            // '@angular-eslint/prefer-standalone': 'warn', // TODO: make all components standalone
            '@angular-eslint/prefer-standalone': 'off',
            '@typescript-eslint/consistent-type-definitions': 'error',
            '@typescript-eslint/dot-notation': 'off',

            '@typescript-eslint/explicit-member-accessibility': [
                'off',
                {
                    accessibility: 'explicit',
                },
            ],

            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: {
                        memberTypes: ['signature', 'field', 'static-initialization', 'constructor', 'accessor', ['get', 'set', 'method']],
                    },
                },
            ],

            camelcase: 'off',

            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: ['camelCase'],
                },
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase'],
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'parameterProperty',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'memberLike',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'property',
                    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'enumMember',
                    format: ['PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'accessor',
                    format: ['camelCase', 'UPPER_CASE'],
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],

            'arrow-parens': ['off', 'always'],
            'brace-style': ['off', '1tbs'], // prettier is currently inconsistent, re-enable if possible
            'guard-for-in': 'error',
            'id-blacklist': 'off',
            'id-match': 'off',
            'import/order': 'off',
            'no-redeclare': ['error', {builtinGlobals: false}],
            'no-underscore-dangle': 'off',
            'valid-typeof': 'error',
            'no-bitwise': 'error',
            'no-empty-function': 'error',
            'no-unused-vars': 'off',

            'no-console': [
                'error',
                {
                    allow: ['warn', 'error'],
                },
            ],

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/explicit-function-return-type': 'error',

            'prefer-arrow/prefer-arrow-functions': [
                'error',
                {
                    singleReturnOnly: true,
                },
            ],
        },
    },
    {
        files: ['**/*.html'],

        extends: compat.extends(
            'plugin:@angular-eslint/template/recommended',
            'plugin:prettier/recommended', // <--- here we inherit from the recommended setup from eslint-plugin-prettier for HTML
        ),

        rules: {},
    },
]);
