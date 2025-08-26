import { setupTestDatabase } from './fixtures/setup'

async function globalSetup() {
  // Setup test database before all tests
  await setupTestDatabase()
}

export default globalSetup