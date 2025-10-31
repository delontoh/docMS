/**
 * Root ESLint config for monorepo: frontend (Next.js) and backend (Node).
 * Uses ESLint 8.x (compatible with Next 14).
 */
module.exports = {
    root: true,
    ignorePatterns: ['node_modules/', '**/dist/', '**/.next/'],
    overrides: [
        //Backend (NodeJS, TypeScript)
        {
            files: ['backend/**/*.{ts,tsx}'],
            env: { node: true, es2022: true },
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./backend/tsconfig.json'],
                tsconfigRootDir: __dirname,
                sourceType: 'module',
            },
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'prettier',
            ],
            rules: {
                '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
            },
        },
        //Frontend (NextJS + TypeScript)
        {
            files: ['frontend/**/*.{ts,tsx}'],
            env: { browser: true, es2022: true },
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./frontend/tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
            plugins: ['@typescript-eslint'],
            extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
        },
    ],
};
