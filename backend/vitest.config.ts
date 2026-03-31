import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./src/test/globalSetup.ts'],
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    // Run test files sequentially so they share the single mongod instance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
