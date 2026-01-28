import { Events } from 'discord.js';
import logger from '../../utils/logger.js';
import Models from '../../database/models/index.js';

export default {
  name: Events.GuildDelete,
  async execute(guild) {
    logger.info(`📤 Left guild: ${guild.name} (${guild.id})`);

    try {
      // Optionnel : Supprimer les données de la guilde
      // await Models.Guild.delete(guild.id);
      logger.info(`Guild ${guild.name} removed from cache`);
    } catch (error) {
      logger.error(`Error processing guild deletion for ${guild.name}:`);
      logger.error(error);
    }
  },
};
