import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        this.supportedColumns = ['verification_channel', 'verification_role']; // Pour la validation interne
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // 1. Création des tables fondamentales
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!',
                    log_channel TEXT,
                    welcome_channel TEXT,
                    level_system_enabled INTEGER DEFAULT 0,
                    verification_channel TEXT,
                    verification_role TEXT
                );

                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT,
                    guild_id TEXT,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, guild_id)
                );

                CREATE TABLE IF NOT EXISTS warns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    guild_id TEXT,
                    reason TEXT,
                    moderator_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    active INTEGER DEFAULT 1
                );
            `);

            // 2. Vérification/Ajout dynamique des colonnes pour éviter les erreurs de type "does not support"
            this.verifySchema();
            
            logger.info('✅ DatabaseHandler: Schema fully synchronized for v2.0.1-beta.1');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Critical Error:', error);
            throw error;
        }
    }

    verifySchema() {
        const info = this.db.prepare("PRAGMA table_info(guilds)").all();
        const columns = info.map(col => col.name);
        
        this.supportedColumns.forEach(col => {
            if (!columns.includes(col)) {
                try {
                    this.db.exec(`ALTER TABLE guilds ADD COLUMN ${col} TEXT;`);
                    logger.info(`++ Column ${col} added to guilds table.`);
                } catch (e) {
                    logger.error(`Failed to add column ${col}:`, e.message);
                }
            }
        });
    }

    // --- Méthodes de Gestion ---

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    createGuild(guildId, guildName) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, name) VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `).run(guildId, guildName);
    }

    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    getStats() {
        try {
            const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get()?.count || 0;
            const users = this.db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
            const warns = this.db.prepare('SELECT COUNT(*) as count FROM warns WHERE active = 1').get()?.count || 0;
            return { guilds, users, warns };
        } catch (e) {
            return { guilds: 0, users: 0, warns: 0 };
        }
    }
}

export default new DatabaseHandler();