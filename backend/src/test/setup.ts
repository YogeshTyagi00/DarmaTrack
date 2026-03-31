import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Configure fast-check to run 100 iterations for all property tests
fc.configureGlobal({ numRuns: 100 })

// Expose the shared MongoDB URI to all test files
const uriFile = join(tmpdir(), 'skincare-test', 'mongo-uri.txt')
try {
  const uri = readFileSync(uriFile, 'utf8').trim()
  process.env.MONGO_TEST_URI = uri
} catch {
  // globalSetup hasn't run yet or file doesn't exist — tests will fail with a clear error
}

