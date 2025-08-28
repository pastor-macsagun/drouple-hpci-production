#!/usr/bin/env tsx
import { existsSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const STORAGE_STATE_DIR = join(process.cwd(), 'test-results', 'auth-states')

async function clearAuthCache() {
  console.log('🧹 Clearing E2E authentication cache...')
  
  if (!existsSync(STORAGE_STATE_DIR)) {
    console.log('📁 Auth cache directory does not exist - nothing to clear')
    return
  }

  try {
    const files = readdirSync(STORAGE_STATE_DIR)
    const authFiles = files.filter(file => file.endsWith('.json'))
    
    if (authFiles.length === 0) {
      console.log('📄 No auth cache files found')
      return
    }

    for (const file of authFiles) {
      const filePath = join(STORAGE_STATE_DIR, file)
      unlinkSync(filePath)
      console.log(`🗑️  Removed ${file}`)
    }

    console.log(`✅ Cleared ${authFiles.length} cached auth state${authFiles.length === 1 ? '' : 's'}`)
    console.log('💡 Next E2E test run will perform fresh authentication for all users')
    
  } catch (error) {
    console.error('❌ Failed to clear auth cache:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  clearAuthCache()
}

export { clearAuthCache }