import { MongoMemoryServer } from 'mongodb-memory-server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

let mongod: MongoMemoryServer

export async function setup() {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  // Write URI to a temp file so test workers can read it
  const dir = join(tmpdir(), 'skincare-test')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'mongo-uri.txt'), uri, 'utf8')
}

export async function teardown() {
  if (mongod) {
    await mongod.stop()
  }
}
