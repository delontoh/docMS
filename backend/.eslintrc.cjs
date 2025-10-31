module.exports = {
	root: true,
	env: { node: true, es2022: true },
	parser: '@typescript-eslint/parser',
	parserOptions: { project: './tsconfig.json', sourceType: 'module' },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'prettier'
	],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['dist/', 'node_modules/'],
	rules: {
		'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }]
	}
};

