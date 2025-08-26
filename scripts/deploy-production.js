const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 HPCI-ChMS Production Deployment Script');
console.log('=========================================\n');

const prodDatabaseUrl = "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true";
const unpooledUrl = "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Backup current .env
if (fs.existsSync('.env')) {
  console.log('📁 Backing up current .env file...');
  fs.copyFileSync('.env', '.env.backup-' + Date.now());
}

try {
  // Create temporary production .env
  console.log('⚙️  Setting up production environment...');
  const prodEnv = `# Temporary production environment for deployment
DATABASE_URL="${prodDatabaseUrl}"
DATABASE_URL_UNPOOLED="${unpooledUrl}"
NEXTAUTH_URL="https://drouple-hpci-prod.vercel.app"
NEXTAUTH_SECRET="4SXeUeyyXepmKPMUWOpjNU8swaXzMRGFbTXnOeDQY3s="
RESEND_API_KEY="re_6Kqgy68i_CXmGXFdtk4YHdBqmtNAvTZxv"
RESEND_FROM_EMAIL="noreply@hpci-chms.com"
EMAIL_FROM="HPCI ChMS <noreply@hpci-chms.com>"
NODE_ENV="production"
APP_ENV="production"
RATE_LIMIT_ENABLED="true"
`;

  fs.writeFileSync('.env', prodEnv);
  
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('📊 Deploying database schema...');
  // Use db push instead of migrate for initial setup
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('🌱 Setting up initial production data...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  
  console.log('\n✅ Production deployment completed successfully!');
  console.log('🌐 Application URL: https://drouple-hpci-prod.vercel.app');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
  
} finally {
  // Restore original .env if it exists
  const backupFiles = fs.readdirSync('.').filter(f => f.startsWith('.env.backup-'));
  if (backupFiles.length > 0) {
    const latestBackup = backupFiles.sort().pop();
    console.log(`🔄 Restoring original .env from ${latestBackup}...`);
    fs.copyFileSync(latestBackup, '.env');
    fs.unlinkSync(latestBackup);
  }
}