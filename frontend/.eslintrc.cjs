module.exports = {
	root: true,
	overrides: [
		{
			files: ['**/*.{ts,tsx}'],
			parser: '@typescript-eslint/parser',
			parserOptions: { project: './tsconfig.json' },
			extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
			plugins: ['@typescript-eslint']
		}
	],
	ignorePatterns: ['.next/', 'node_modules/']
};

