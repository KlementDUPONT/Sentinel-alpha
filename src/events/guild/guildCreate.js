import { Events } from 'discord.js';
import logger from '../../utils/logger.js';
import Models from '../../database/models/index.js';

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    logger.info(`📥 Joined new guild: ${guild.name} (${guild.id})`);
    logger.info(`   Members: ${guild.memberCount}`);

    try {
      // Créer la configuration de la guilde dans la base de données
      await Models.Guild.getOrCreate(guild.id);
      logger.info(`✅ Guild configuration created for ${guild.name}`);
    } catch (error) {
      logger.error(`Failed to create guild configuration for ${guild.name}:`);
      logger.error(error);
    }
  },
};
