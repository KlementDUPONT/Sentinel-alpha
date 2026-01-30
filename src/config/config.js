import dotenv from 'dotenv';

dotenv.config();

const config = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  ownerId: process.env.OWNER_ID || '',
  version: 'alpha.2',
  environment: process.env.NODE_ENV || 'production',
  prefix: '!',
  port: parseInt(process.env.PORT) || 8000
};

if (!config.token) {
  console.warn('WARNING: DISCORD_TOKEN is not set');
}

if (!config.clientId) {
  console.warn('WARNING: DISCORD_CLIENT_ID is not set');
}

if (!config.ownerId) {
  console.warn('WARNING: OWNER_ID is not set');
}

export default config;
