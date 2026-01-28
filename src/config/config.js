import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  // Bot Information
  bot: {
    name: process.env.NODE_ENV === 'production' ? 'Sentinel' : 'Sentinel Alpha',
    version: '2.0.0-alpha.1',
    defaultPrefix: process.env.NODE_ENV === 'production' 
      ? process.env.BOT_PREFIX_PROD || '+' 
      : process.env.BOT_PREFIX_DEV || '+dev',
    developers: ['TON_USER_ID_ICI'], // Remplace par ton ID Discord
  },

  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID || null, // Pour les tests
  },

  // Environment
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || join(__dirname, '../../data/sentinel.db'),
  },

  // API Server
  api: {
    port: parseInt(process.env.API_PORT) || 3001,
    host: process.env.API_HOST || 'localhost',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',
  },

  // Dashboard
  dashboard: {
    url: process.env.DASHBOARD_URL || 'http://localhost:3000',
    callbackURL: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/callback',
  },

  // OAuth2
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Colors (Pastel Theme)
  colors: {
    primary: 0xB4A7D6,    // Lavande pastel
    secondary: 0xFFD5CD,  // Rose pastel
    success: 0xC8E6C9,    // Vert pastel
    error: 0xFFCDD2,      // Rouge pastel
    warning: 0xFFE082,    // Jaune pastel
    info: 0xB3E5FC,       // Bleu pastel
  },

  // Couleur aléatoire pastel
  getRandomColor() {
    const colors = Object.values(this.colors);
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Validation
  validate() {
    const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  },
};

// Valider la configuration au démarrage
config.validate();

export default config;
