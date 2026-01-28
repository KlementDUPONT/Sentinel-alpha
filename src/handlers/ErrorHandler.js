import { EmbedBuilder } from 'discord.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Gestionnaire d'erreurs centralisé
 */
class ErrorHandler {
  constructor(client) {
    this.client = client;
    this.setupHandlers();
  }

  /**
   * Configure les gestionnaires d'erreurs globaux
   */
  setupHandlers() {
    // Erreurs non gérées
    process.on('unhandledRejection', (error) => {
      logger.error('❌ Unhandled Promise Rejection:');
      logger.error(error);
      this.logError('UnhandledRejection', error);
    });

    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:');
      logger.error(error);
      this.logError('UncaughtException', error);
      
      // En production, on redémarre le bot
      if (config.env.isProduction) {
        logger.error('🔄 Restarting bot due to uncaught exception...');
        process.exit(1);
      }
    });

    // Avertissements
    process.on('warning', (warning) => {
      logger.warn(`⚠️  Warning: ${warning.name}`);
      logger.warn(warning.message);
      if (warning.stack) {
        logger.debug(warning.stack);
      }
    });

    // Erreurs Discord.js
    this.client.on('error', (error) => {
      logger.error('❌ Discord Client Error:');
      logger.error(error);
    });

    this.client.on('warn', (warning) => {
      logger.warn(`⚠️  Discord Client Warning: ${warning}`);
    });

    // Gestion des rejets de shards (si sharded)
    this.client.on('shardError', (error, shardId) => {
      logger.error(`❌ Shard ${shardId} Error:`);
      logger.error(error);
    });
  }

  /**
   * Gère les erreurs des commandes
   */
  async handleCommandError(interaction, error) {
    logger.error(`❌ Command Error [${interaction.commandName}]:`);
    logger.error(`User: ${interaction.user.tag} (${interaction.user.id})`);
    logger.error(`Guild: ${interaction.guild?.name || 'DM'} (${interaction.guildId || 'DM'})`);
    logger.error(error);

    const errorEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('❌ Une erreur est survenue')
      .setDescription(
        config.env.isDevelopment
          ? `\`\`\`js\n${error.message}\n\`\`\``
          : 'Une erreur inattendue s\'est produite lors de l\'exécution de cette commande.'
      )
      .setFooter({ 
        text: config.env.isDevelopment 
          ? `${error.name} | ${config.bot.name}` 
          : config.bot.name 
      })
      .setTimestamp();

    // Ajoute la stack trace en développement
    if (config.env.isDevelopment && error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5).join('\n');
      errorEmbed.addFields({
        name: '📋 Stack Trace',
        value: `\`\`\`js\n${stackLines}\n\`\`\``,
      });
    }

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (replyError) {
      logger.error('❌ Failed to send error message to user:');
      logger.error(replyError);
    }
  }

  /**
   * Gère les erreurs d'événements
   */
  handleEventError(eventName, error) {
    logger.error(`❌ Event Error [${eventName}]:`);
    logger.error(error);
    this.logError(`Event: ${eventName}`, error);
  }

  /**
   * Gère les erreurs de base de données
   */
  handleDatabaseError(context, error) {
    logger.error(`❌ Database Error [${context}]:`);
    logger.error(error);
    this.logError(`Database: ${context}`, error);
  }

  /**
   * Gère les erreurs d'API
   */
  handleAPIError(endpoint, error) {
    logger.error(`❌ API Error [${endpoint}]:`);
    logger.error(error);
    this.logError(`API: ${endpoint}`, error);
  }

  /**
   * Log une erreur avec contexte
   */
  logError(context, error) {
    const errorLog = {
      context,
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    logger.error(JSON.stringify(errorLog, null, 2));
  }

  /**
   * Crée un embed d'erreur personnalisé
   */
  createErrorEmbed(title, description, fields = []) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();

    if (fields.length > 0) {
      embed.addFields(fields);
    }

    return embed;
  }

  /**
   * Envoie une erreur dans un canal spécifique
   */
  async sendErrorToChannel(channel, error, context = '') {
    if (!channel || !channel.isTextBased()) return;

    const embed = this.createErrorEmbed(
      'Erreur Système',
      context || 'Une erreur s\'est produite',
      config.env.isDevelopment
        ? [
            { name: 'Erreur', value: `\`\`\`js\n${error.message}\n\`\`\``, inline: false },
            { name: 'Type', value: error.name, inline: true },
          ]
        : []
    );

    try {
      await channel.send({ embeds: [embed] });
    } catch (sendError) {
      logger.error('Failed to send error to channel:', sendError);
    }
  }
}

export default ErrorHandler;
