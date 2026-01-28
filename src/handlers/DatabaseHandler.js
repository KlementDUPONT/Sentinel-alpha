import dbConnection from '../database/connection.js';
import MigrationManager from '../database/migrate.js';
import logger from '../utils/logger.js';
import Models from '../database/models/index.js';

/**
 * Gestionnaire de base de données
 */
class DatabaseHandler {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.models = Models;
  }

  /**
   * Initialise la connexion et les migrations
   */
  async initialize() {
    try {
      logger.info('📦 Initializing database...');

      // Connexion
      this.db = dbConnection.connect();
      this.isConnected = true;

      // Execute les migrations
      const migrationManager = new MigrationManager();
      await migrationManager.runMigrations();

      logger.info('✅ Database initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize database:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Ferme la connexion
   */
  close() {
    if (this.isConnected) {
      dbConnection.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  /**
   * Obtient le statut de la connexion
   */
  getStatus() {
    return dbConnection.getStatus();
  }

  /**
   * Obtient l'instance de la base de données
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Vérifie la santé de la base de données
   */
  healthCheck() {
    try {
      const stmt = this.db.prepare('SELECT 1');
      stmt.get();
      return { healthy: true, connected: this.isConnected };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { healthy: false, connected: false, error: error.message };
    }
  }

  /**
   * Obtient des statistiques sur la base de données
   */
  getStats() {
    try {
      const stats = {
        guilds: this.models.Guild.count(),
        users: this.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        warns: this.db.prepare('SELECT COUNT(*) as count FROM warns WHERE active = 1').get().count,
        tickets: this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = "open"').get().count,
        giveaways: this.db.prepare('SELECT COUNT(*) as count FROM giveaways WHERE ended = 0').get().count,
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return null;
    }
  }

  /**
   * Nettoie les données anciennes (maintenance)
   */
  cleanup() {
    try {
      logger.info('🧹 Running database cleanup...');

      const cleanupTransaction = this.db.transaction(() => {
        // Supprime les tickets fermés depuis plus de 30 jours
        this.db.prepare(`
          DELETE FROM tickets 
          WHERE status = 'closed' 
          AND closed_at < datetime('now', '-30 days')
        `).run();

        // Supprime les giveaways terminés depuis plus de 30 jours
        this.db.prepare(`
          DELETE FROM giveaways 
          WHERE ended = 1 
          AND ends_at < datetime('now', '-30 days')
        `).run();

        // Supprime les utilisateurs AFK depuis plus de 7 jours
        this.db.prepare(`
          DELETE FROM afk_users 
          WHERE set_at < datetime('now', '-7 days')
        `).run();
      });

      cleanupTransaction();
      logger.info('✅ Database cleanup completed');
    } catch (error) {
      logger.error('❌ Database cleanup failed:', error);
    }
  }

  /**
   * Backup de la base de données
   */
  async backup(destination) {
    try {
      logger.info(`💾 Creating database backup to ${destination}...`);
      
      const backup = this.db.backup(destination);
      await backup.step(-1); // Copy all pages
      await backup.finish();
      
      logger.info('✅ Database backup completed');
      return true;
    } catch (error) {
      logger.error('❌ Database backup failed:', error);
      throw error;
    }
  }
}

export default DatabaseHandler;
