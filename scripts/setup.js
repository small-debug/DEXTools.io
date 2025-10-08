#!/usr/bin/env node

/**
 * Setup script for DEXTools Qubic API
 * This script helps initialize the project and verify the setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up DEXTools Qubic API...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
  } else {
    console.log('⚠️  No .env.example file found, creating basic .env...');
    const basicEnv = `# Server Configuration
PORT=3000
NODE_ENV=development

# Qubic RPC Configuration
QUBIC_RPC_URL=https://rpc.qubic.org/v1
QUBIC_RPC_TIMEOUT=10000

# API Configuration
API_VERSION=v1
CORS_ORIGIN=*
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Verify project structure
console.log('\n🔍 Verifying project structure...');

const requiredFiles = [
  'src/index.js',
  'src/routes/qubic.js',
  'src/services/qubicClient.js',
  'src/middleware/errorHandler.js',
  'src/middleware/validation.js',
  'package.json',
  'README.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the project structure.');
  process.exit(1);
}

// Test API health (if server is running)
console.log('\n🏥 Testing API health...');
try {
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ API is running and healthy');
    } else {
      console.log(`⚠️  API responded with status ${res.statusCode}`);
    }
  });

  req.on('error', () => {
    console.log('ℹ️  API server is not running (this is normal for first setup)');
  });

  req.on('timeout', () => {
    console.log('ℹ️  API server is not running (this is normal for first setup)');
  });

  req.end();
} catch (error) {
  console.log('ℹ️  Could not test API health (this is normal for first setup)');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📚 Next steps:');
console.log('1. Review and update .env file if needed');
console.log('2. Start the server: npm run dev');
console.log('3. Visit http://localhost:3000/api/v1/docs for API documentation');
console.log('4. Run tests: npm test');
console.log('5. Check examples in examples/usage.js');

console.log('\n🔗 Useful commands:');
console.log('- npm start          # Start production server');
console.log('- npm run dev        # Start development server');
console.log('- npm test           # Run tests');
console.log('- npm run build      # Build for production (if applicable)');

console.log('\n📖 For more information, see README.md');
