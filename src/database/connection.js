import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Singleton pour gérer la connexion à la base de données SQLite
 */
class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialise la connexion à la base de données
   */
  connect() {
    if (this.isConnected && this.db) {
      logger.warn('Database already connected');
      return this.db;
    }

    try {
      // Définir le chemin de la base de données
      const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/sentinel.db');
      const dbDir = dirname(dbPath);

      // Créer le dossier data s'il n'existe pas
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        logger.info(`📁 Created database directory: ${dbDir}`);
      }

      // Créer la connexion
      this.db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? logger.debug : null,
      });

      // Configuration de la base de données
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging pour de meilleures performances
      this.db.pragma('foreign_keys = ON'); // Activer les clés étrangères

      this.isConnected = true;
      logger.info(`✅ Database connected: ${dbPath}`);

      // Initialiser les tables
      this.initializeTables();

      return this.db;
    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Récupère l'instance de la base de données (avec auto-connect)
   */
  getDatabase() {
    // Auto-connect si pas encore connecté
    if (!this.db || !this.isConnected) {
      logger.warn('⚠️ Database not connected. Auto-connecting...');
      this.connect();
    }

    if (!this.db) {
      throw new Error('Failed to auto-connect to database.');
    }

    return this.db;
  }

  /**
   * Initialise les tables de la base de données
   */
  initializeTables() {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    logger.info('📋 Initializing database tables...');

    // Table des serveurs (guilds)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prefix TEXT DEFAULT '+',
        language TEXT DEFAULT 'fr',
        timezone TEXT DEFAULT 'Europe/Paris',
        premium BOOLEAN DEFAULT 0,
        joined_at INTEGER NOT NULL,
        left_at INTEGER,
        settings TEXT DEFAULT '{}',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Table des utilisateurs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        discriminator TEXT,
        avatar TEXT,
        bot BOOLEAN DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Table des membres (liaison guild-user)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        nickname TEXT,
        roles TEXT DEFAULT '[]',
        joined_at INTEGER NOT NULL,
        left_at INTEGER,
        warnings INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE(guild_id, user_id)
      )
    `);

    // Table des logs de modération
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        duration INTEGER,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Index pour améliorer les performances
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_members_guild ON members(guild_id);
      CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
      CREATE INDEX IF NOT EXISTS idx_moderation_guild ON moderation_logs(guild_id);
      CREATE INDEX IF NOT EXISTS idx_moderation_user ON moderation_logs(user_id);
    `);

    logger.info('✅ Database tables initialized');
  }

  /**
   * Ferme la connexion à la base de données
   */
  close() {
    if (this.db && this.isConnected) {
      this.db.close();
      this.isConnected = false;
      this.db = null;
      logger.info('👋 Database connection closed');
    }
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnectedToDatabase() {
    return this.isConnected && this.db !== null;
  }
}

// Export singleton
const dbConnection = new DatabaseConnection();
export default dbConnection;
