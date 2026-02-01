// src/handlers/DatabaseHandler.js
import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        this.supportedColumns = ['guild_id', 'name', 'verification_channel', 'verification_role'];
    }

    async initialize() {
        this.db = dbConnection.connect();
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                name TEXT,
                verification_channel TEXT,
                verification_role TEXT
            );
        `);
        logger.info('✅ DB: Système de vérification prêt.');
    }

    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, verification_channel, verification_role) 
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET 
                verification_channel = excluded.verification_channel,
                verification_role = excluded.verification_role
        `).run(guildId, channelId, roleId);
    }

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }
}
export default new DatabaseHandler();