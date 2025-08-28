import { fastSetupTestDatabase } from '../fast-setup'

export async function setupTestDatabase() {
  // Use fast setup to avoid unnecessary database resets
  await fastSetupTestDatabase()
}