import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // Création des tables avec les colonnes nécessaires pour la Beta
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!',
                    verification_channel TEXT,
                    verification_role TEXT,
                    log_channel TEXT,
                    welcome_channel TEXT
                );
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT,
                    guild_id TEXT,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, guild_id)
                );
            `);
            
            logger.info('✅ DatabaseHandler: Schema verified.');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Error:', error);
            throw error;
        }
    }

    // Cette méthode a été corrigée pour accepter la synchronisation du démarrage
    createGuild(guildId, guildName) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO guilds (guild_id, name) 
                VALUES (?, ?) 
                ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
            `);
            return stmt.run(guildId, guildName);
        } catch (err) {
            logger.error(`Failed to create/update guild ${guildId}:`, err);
            throw err;
        }
    }

    getStats() {
        try {
            const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get()?.count || 0;
            const users = this.db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
            return { guilds, users, warns: 0 };
        } catch (e) {
            return { guilds: 0, users: 0, warns: 0 };
        }
    }
}

export default new DatabaseHandler();