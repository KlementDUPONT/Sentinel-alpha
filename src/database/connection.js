import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialise la connexion à la base de données
   */
  connect() {
    try {
      // Créer le dossier data s'il n'existe pas
      const dbDir = dirname(config.database.path);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      // Connexion à SQLite
      this.db = new Database(config.database.path, {
        verbose: config.env.isDevelopment ? logger.database : null,
      });

      // Configuration pour de meilleures performances
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');

      this.isConnected = true;
      logger.info('✅ Connected to SQLite database successfully');
      logger.database('connect', `Path: ${config.database.path}`);

      return this.db;
    } catch (error) {
      logger.error(`❌ Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ferme la connexion
   */
  close() {
    if (this.db) {
      this.db.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  /**
   * Obtient l'instance de la base de données
   */
  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Vérifie si la base de données est connectée
   */
  getStatus() {
    return {
      connected: this.isConnected,
      path: config.database.path,
      exists: existsSync(config.database.path),
    };
  }

  /**
   * Execute une requête préparée
   */
  prepare(sql) {
    return this.db.prepare(sql);
  }

  /**
   * Execute une transaction
   */
  transaction(callback) {
    return this.db.transaction(callback);
  }
}

// Export singleton
const dbConnection = new DatabaseConnection();
export default dbConnection;
