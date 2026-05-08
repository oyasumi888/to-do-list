import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/test-log.json'
    }
  }
})
