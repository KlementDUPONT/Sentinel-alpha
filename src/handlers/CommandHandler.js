import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gestionnaire de commandes
 */
class CommandHandler {
  constructor(client) {
    this.client = client;
    this.client.commands = new Collection();
    this.commandsPath = join(__dirname, '../commands');
    this.cooldowns = new Collection();
  }

  /**
   * Charge toutes les commandes
   */
  async loadCommands() {
    try {
      logger.info('📦 Loading commands...');
      
      const categories = readdirSync(this.commandsPath);
      let commandCount = 0;

      for (const category of categories) {
        const categoryPath = join(this.commandsPath, category);
        const commandFiles = readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
          try {
            const filePath = join(categoryPath, file);
            const command = await import(`file://${filePath}`);
            const commandData = command.default;

            if (!commandData.data || !commandData.execute) {
              logger.warn(`⚠️  Command ${file} is missing required "data" or "execute" property`);
              continue;
            }

            // Ajoute la catégorie à la commande
            commandData.category = category;

            // Enregistre la commande
            this.client.commands.set(commandData.data.name, commandData);
            commandCount++;
            
            logger.info(`✓ Loaded command: /${commandData.data.name} [${category}]`);
          } catch (error) {
            logger.error(`❌ Failed to load command ${file}:`);
            logger.error(error);
          }
        }
      }

      logger.info(`✅ Loaded ${commandCount} commands successfully`);
      return commandCount;
    } catch (error) {
      logger.error('❌ Failed to load commands:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Déploie les commandes slash sur Discord
   */
  async deployCommands() {
    try {
      const commands = [];
      
      for (const command of this.client.commands.values()) {
        commands.push(command.data.toJSON());
      }

      const rest = new REST().setToken(config.discord.token);

      logger.info(`🔄 Deploying ${commands.length} slash commands...`);

      // Deploy sur un serveur spécifique (instantané pour le développement)
      if (config.discord.guildId) {
        await rest.put(
          Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
          { body: commands }
        );
        logger.info('✅ Successfully deployed guild commands');
      } else {
        // Deploy global (prend jusqu'à 1 heure)
        await rest.put(
          Routes.applicationCommands(config.discord.clientId),
          { body: commands }
        );
        logger.info('✅ Successfully deployed global commands');
      }

      return commands.length;
    } catch (error) {
      logger.error('❌ Failed to deploy commands:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Vérifie les cooldowns
   */
  checkCooldown(userId, commandName, cooldownAmount) {
    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName);
    const cooldownDuration = (cooldownAmount || 3) * 1000;

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownDuration;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return { onCooldown: true, timeLeft: timeLeft.toFixed(1) };
      }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownDuration);

    return { onCooldown: false, timeLeft: 0 };
  }

  /**
   * Recharge une commande spécifique
   */
  async reloadCommand(commandName) {
    try {
      const command = this.client.commands.get(commandName);
      if (!command) {
        throw new Error(`Command ${commandName} not found`);
      }

      const filePath = join(this.commandsPath, command.category, `${commandName}.js`);
      
      // Supprime du cache
      delete require.cache[require.resolve(filePath)];
      
      // Recharge
      const reloadedCommand = await import(`file://${filePath}?update=${Date.now()}`);
      const commandData = reloadedCommand.default;

      commandData.category = command.category;
      this.client.commands.set(commandData.data.name, commandData);

      logger.info(`✅ Reloaded command: /${commandName}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to reload command ${commandName}:`);
      logger.error(error);
      throw error;
    }
  }

  /**
   * Supprime toutes les commandes
   */
  async clearCommands() {
    try {
      const rest = new REST().setToken(config.discord.token);

      logger.info('🗑️  Clearing all commands...');

      if (config.discord.guildId) {
        await rest.put(
          Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
          { body: [] }
        );
      } else {
        await rest.put(
          Routes.applicationCommands(config.discord.clientId),
          { body: [] }
        );
      }

      logger.info('✅ All commands cleared');
    } catch (error) {
      logger.error('❌ Failed to clear commands:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Obtient des statistiques sur les commandes
   */
  getStats() {
    const categories = {};
    
    this.client.commands.forEach(command => {
      if (!categories[command.category]) {
        categories[command.category] = 0;
      }
      categories[command.category]++;
    });

    return {
      total: this.client.commands.size,
      categories,
    };
  }

  /**
   * Liste toutes les commandes
   */
  getCommandsList() {
    const commandsList = {};
    
    this.client.commands.forEach(command => {
      if (!commandsList[command.category]) {
        commandsList[command.category] = [];
      }
      
      commandsList[command.category].push({
        name: command.data.name,
        description: command.data.description,
      });
    });

    return commandsList;
  }
}

export default CommandHandler;
