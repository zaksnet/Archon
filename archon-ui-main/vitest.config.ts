/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    setupFiles: './test/setup.ts',
    include: [
      'test/components.test.tsx',
      'test/pages.test.tsx', 
      'test/user_flows.test.tsx',
      'test/errors.test.tsx',
      'src/**/*.test.{ts,tsx}'
    ],
    exclude: ['node_modules', 'dist', '.git', '.cache', 'test.backup', '*.backup/**', 'test-backups'],
    reporters: ['default'],
    outputFile: { 
      json: './public/test-results/test-results.json' 
    },
    testTimeout: 5000, // 5 seconds timeout
    hookTimeout: 5000, // 5 seconds for setup/teardown
    teardownTimeout: 1000, // 1 second teardown timeout
    // Use threads pool with single thread to avoid hanging
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false,
      }
    },
    // Disable file parallelism to prevent hanging
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: [
        'text', 
        'text-summary', 
        'html', 
        'json', 
        'json-summary',
        'lcov'
      ],
      reportsDirectory: './public/test-results/coverage',
      clean: false, // Don't clean the directory as it may be in use
      reportOnFailure: true, // Generate coverage reports even when tests fail
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/*.test.{ts,tsx}',
        'src/env.d.ts',
        'coverage/**',
        'dist/**',
        'public/**',
        '**/*.stories.*',
        '**/*.story.*',
      ],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      thresholds: {}
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}) 