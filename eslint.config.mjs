import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['lib/', 'pages/']
    },
    {
        files: ['src/**/*.ts'],
        extends: [
            ...tseslint.configs.recommended
        ],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        rules: {
            'prefer-const': ['warn', { destructuring: 'all' }],
            'no-var': 'warn',
            'eqeqeq': ['warn', 'smart'],
            'curly': ['warn', 'all'],
            'no-eval': 'warn',
            'radix': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 0 }],
            'no-caller': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'warn',
            '@typescript-eslint/no-array-constructor': 'warn'
        }
    }
);
