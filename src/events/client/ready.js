import { Events, ActivityType } from 'discord.js';
import logger from '../../utils/logger.js';
import config from '../../config/config.js';
import { STATUS_ACTIVITIES } from '../../config/constants.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`✅ ${client.user.tag} is now online!`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`📊 Guilds: ${client.guilds.cache.size}`);
    logger.info(`👥 Users: ${client.users.cache.size}`);
    logger.info(`📝 Commands: ${client.commands.size}`);
    logger.info(`🎯 Events: ${client.eventHandler.getLoadedEvents().length}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Déployer les commandes automatiquement
    try {
      if (client.commands.size > 0) {
        logger.info('🔄 Auto-deploying slash commands...');
        await client.commandHandler.deployCommands();
      }
    } catch (error) {
      logger.error('❌ Failed to auto-deploy commands:');
      logger.error(error);
    }

    // Configuration du statut
    const activities = STATUS_ACTIVITIES.map(activity => ({
      name: activity.name
        .replace('{prefix}', config.bot.defaultPrefix)
        .replace('{version}', config.bot.version)
        .replace('{guilds}', client.guilds.cache.size)
        .replace('{users}', client.users.cache.size),
      type: activity.type,
    }));

    let currentActivity = 0;

    // Définir le statut initial
    client.user.setPresence({
      activities: [activities[currentActivity]],
      status: 'online',
    });

    // Changer le statut toutes les 30 secondes
    setInterval(() => {
      currentActivity = (currentActivity + 1) % activities.length;
      client.user.setPresence({
        activities: [activities[currentActivity]],
        status: 'online',
      });
    }, 30000);

    // Vérifier la santé de la base de données
    const dbHealth = client.databaseHandler.healthCheck();
    if (dbHealth.healthy) {
      logger.info('💾 Database: Healthy');
    } else {
      logger.error('💾 Database: Unhealthy');
      logger.error(dbHealth.error);
    }

    // Statistiques de la base de données
    try {
      const dbStats = client.databaseHandler.getStats();
      if (dbStats) {
        logger.info('📊 Database Stats:');
        logger.info(`   • Guilds: ${dbStats.guilds}`);
        logger.info(`   • Users: ${dbStats.users}`);
        logger.info(`   • Active Warns: ${dbStats.warns}`);
        logger.info(`   • Open Tickets: ${dbStats.tickets}`);
        logger.info(`   • Active Giveaways: ${dbStats.giveaways}`);
      }
    } catch (error) {
      logger.error('Failed to get database stats:', error);
    }

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🎉 ${config.bot.name} is ready to serve!`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  },
};
