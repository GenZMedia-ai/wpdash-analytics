// Static export configuration for Next.js 14+
// This creates a static version of the dashboard for deployment

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting static export...');

// Update next.config.js temporarily for static export
const nextConfigPath = path.join(__dirname, 'next.config.js');
const originalConfig = fs.readFileSync(nextConfigPath, 'utf-8');

const staticConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
`;

try {
  // Write static config
  fs.writeFileSync(nextConfigPath, staticConfig);
  
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Static export complete! Files are in the "out" directory.');
  
} catch (error) {
  console.error('❌ Export failed:', error.message);
  process.exit(1);
} finally {
  // Restore original config
  fs.writeFileSync(nextConfigPath, originalConfig);
  console.log('🔄 Restored original next.config.js');
}