import { FlatCompat } from '@eslint/eslintrc';

/**
 * ESLint 9 flat config wrapping the eslintrc-style `eslint-config-next`
 * (core-web-vitals + typescript rules).
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'eslint.config.mjs',
    ],
  },
];

export default eslintConfig;
