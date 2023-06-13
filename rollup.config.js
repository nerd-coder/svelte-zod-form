import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import filesize from 'rollup-plugin-filesize'
import nodeResolve from '@rollup/plugin-node-resolve'

import pkg from './package.json' assert { type: 'json' }

export default defineConfig({
  input: './src/lib/index.ts',
  output: [
    { file: pkg.module, format: 'esm' },
    { file: pkg.main, format: 'cjs' },
  ],
  external: ['svelte/store', 'zod'],
  plugins: [
    typescript({ include: ['src/lib/**'], declaration: true, declarationDir: 'dist' }),
    filesize(),
    nodeResolve(),
  ],
})
