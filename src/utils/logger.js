import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const config = {
  // Discord Configuration
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  ownerId: process.env.OWNER_ID || '',
  
  // Bot Information
  version: 'alpha.2',
  environment: process.env.NODE_ENV || 'production',
  prefix: '!',
  
  // Server Configuration
  port: parseInt(process.env.PORT) || 8000,
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'simple'
  },
  
  // Environment Helpers
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTesting: process.env.NODE_ENV === 'test'
  }
};

// Validation
if (!config.token) {
  console.warn('⚠️ DISCORD_TOKEN is not set in environment variables');
}

if (!config.clientId) {
  console.warn('⚠️ DISCORD_CLIENT_ID is not set in environment variables');
}

if (!config.ownerId) {
  console.warn('⚠️ OWNER_ID is not set in environment variables');
}

export default config;
