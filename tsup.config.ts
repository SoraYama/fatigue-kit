import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      legacy: 'src/legacy.ts',
      'adapters/memory': 'src/adapters/memory.ts',
      'adapters/local-storage': 'src/adapters/local-storage.ts',
      'adapters/session-storage': 'src/adapters/session-storage.ts',
      'adapters/async-storage': 'src/adapters/async-storage.ts',
      'adapters/weapp': 'src/adapters/weapp.ts',
      'adapters/alipay': 'src/adapters/alipay.ts',
      'adapters/node-file': 'src/adapters/node-file.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    // ESM entries share a common chunk, so using several adapters does not
    // duplicate the core engine. CJS entries stay self-contained on purpose
    // (mini-program "构建 npm" walks plain require() graphs).
    splitting: true,
    target: 'es2018',
    clean: true,
  },
  {
    // All-in-one `<script>` build for CDN / no-bundler pages, exposed as
    // `window.FatigueKit` and shipped via the "./global" subpath.
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'FatigueKit',
    outDir: 'dist/global',
    minify: true,
    sourcemap: true,
    target: 'es2018',
    dts: false,
  },
])
