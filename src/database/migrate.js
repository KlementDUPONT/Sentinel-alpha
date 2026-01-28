import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dbConnection from './connection.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Système de migration de base de données
 */
class MigrationManager {
  constructor() {
    this.migrationsPath = join(__dirname, 'migrations');
    this.db = null;
  }

  /**
   * Initialise la table des migrations
   */
  initMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Obtient les migrations déjà exécutées
   */
  getExecutedMigrations() {
    const stmt = this.db.prepare('SELECT name FROM migrations ORDER BY id');
    return stmt.all().map(row => row.name);
  }

  /**
   * Enregistre une migration exécutée
   */
  recordMigration(name) {
    const stmt = this.db.prepare('INSERT INTO migrations (name) VALUES (?)');
    stmt.run(name);
  }

  /**
   * Obtient toutes les migrations disponibles
   */
  getAvailableMigrations() {
    const files = readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    return files;
  }

  /**
   * Execute toutes les migrations en attente
   */
  async runMigrations() {
    try {
      // Connexion à la base de données
      this.db = dbConnection.connect();
      
      // Initialise la table des migrations
      this.initMigrationsTable();

      // Récupère les migrations
      const executed = this.getExecutedMigrations();
      const available = this.getAvailableMigrations();
      
      const pending = available.filter(name => !executed.includes(name));

      if (pending.length === 0) {
        logger.info('✅ No pending migrations');
        return;
      }

      logger.info(`📦 Running ${pending.length} migration(s)...`);

      // Execute chaque migration
      for (const migrationFile of pending) {
        const migrationPath = join(this.migrationsPath, migrationFile);
        const migration = await import(`file://${migrationPath}`);

        logger.info(`⏳ Running migration: ${migrationFile}`);
        
        try {
          // Execute la migration dans une transaction
          const runMigration = this.db.transaction(() => {
            migration.up(this.db);
            this.recordMigration(migrationFile);
          });

          runMigration();
          logger.info(`✅ Migration completed: ${migrationFile}`);
        } catch (error) {
          logger.error(`❌ Migration failed: ${migrationFile}`);
          logger.error(error);
          throw error;
        }
      }

      logger.info('✅ All migrations completed successfully');
    } catch (error) {
      logger.error(`❌ Migration error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback de la dernière migration
   */
  async rollbackLastMigration() {
    try {
      this.db = dbConnection.connect();
      
      const executed = this.getExecutedMigrations();
      if (executed.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = executed[executed.length - 1];
      const migrationPath = join(this.migrationsPath, lastMigration);
      const migration = await import(`file://${migrationPath}`);

      logger.info(`⏳ Rolling back migration: ${lastMigration}`);

      const rollback = this.db.transaction(() => {
        migration.down(this.db);
        this.db.prepare('DELETE FROM migrations WHERE name = ?').run(lastMigration);
      });

      rollback();
      logger.info(`✅ Rollback completed: ${lastMigration}`);
    } catch (error) {
      logger.error(`❌ Rollback error: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new MigrationManager();
  
  const command = process.argv[2];

  if (command === 'rollback') {
    manager.rollbackLastMigration()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    manager.runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export default MigrationManager;
