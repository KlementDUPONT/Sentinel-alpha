import { unlinkSync, existsSync } from 'fs';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MigrationManager from './migrate.js';

/**
 * Reset complet de la base de données
 */
async function resetDatabase() {
  try {
    logger.warn('⚠️  Resetting database...');

    // Supprime le fichier de base de données
    if (existsSync(config.database.path)) {
      unlinkSync(config.database.path);
      logger.info('🗑️  Database file deleted');
    }

    // Re-créé la base avec les migrations
    logger.info('📦 Running migrations...');
    const manager = new MigrationManager();
    await manager.runMigrations();

    logger.info('✅ Database reset completed successfully');
  } catch (error) {
    logger.error(`❌ Database reset failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default resetDatabase;
