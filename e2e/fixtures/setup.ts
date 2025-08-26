import { execSync } from 'child_process'

export async function setupTestDatabase() {
  console.log('🔧 Setting up test database...')
  
  // Reset and seed the database
  execSync('npm run seed', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })
  
  console.log('✅ Test database ready')
}