module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  env: {
    es2022: true,
    node: true
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'import/order': 'off',
    'import/namespace': 'off',
    'import/no-unresolved': 'off',
    'import/no-duplicates': 'off'
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json'],
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.js', '.ts']
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts']
    }
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.cjs']
};
