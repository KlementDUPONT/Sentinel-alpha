import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script de déploiement des commandes slash
 */

const commands = [];
const commandsPath = join(__dirname, 'commands');

/**
 * Charge toutes les commandes
 */
async function loadCommands() {
  try {
    logger.info('📦 Loading commands for deployment...');
    
    const categories = readdirSync(commandsPath);

    for (const category of categories) {
      const categoryPath = join(commandsPath, category);
      const commandFiles = readdirSync(categoryPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        try {
          const filePath = join(categoryPath, file);
          const command = await import(`file://${filePath}`);
          const commandData = command.default;

          if ('data' in commandData && 'execute' in commandData) {
            commands.push(commandData.data.toJSON());
            logger.info(`✓ Loaded: ${commandData.data.name}`);
          } else {
            logger.warn(`⚠️  Skipping ${file}: missing "data" or "execute"`);
          }
        } catch (error) {
          logger.error(`❌ Failed to load ${file}:`);
          logger.error(error);
        }
      }
    }

    logger.info(`✅ Loaded ${commands.length} commands`);
  } catch (error) {
    logger.error('❌ Failed to load commands:');
    logger.error(error);
    process.exit(1);
  }
}

/**
 * Déploie les commandes sur Discord
 */
async function deployCommands() {
  const rest = new REST().setToken(config.discord.token);

  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🔄 Deploying ${commands.length} application commands...`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (config.discord.guildId) {
      // Deploy sur un serveur spécifique (instantané)
      logger.info(`📍 Target: Guild (${config.discord.guildId})`);
      
      const data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`✅ Successfully deployed ${data.length} guild commands!`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      // Deploy global (prend jusqu'à 1 heure)
      logger.info('🌍 Target: Global');
      logger.warn('⚠️  Global deployment can take up to 1 hour to update');
      
      const data = await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`✅ Successfully deployed ${data.length} global commands!`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Liste les commandes déployées
    logger.info('\n📋 Deployed commands:');
    commands.forEach(cmd => {
      logger.info(`   ✓ /${cmd.name} - ${cmd.description}`);
    });

  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ Failed to deploy commands:');
    logger.error(error);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

/**
 * Supprime toutes les commandes
 */
async function clearCommands() {
  const rest = new REST().setToken(config.discord.token);

  try {
    logger.info('🗑️  Clearing all commands...');

    if (config.discord.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: [] }
      );
      logger.info('✅ Guild commands cleared');
    } else {
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: [] }
      );
      logger.info('✅ Global commands cleared');
    }
  } catch (error) {
    logger.error('❌ Failed to clear commands:');
    logger.error(error);
    process.exit(1);
  }
}

// Execute
(async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'clear') {
    await clearCommands();
  } else {
    await loadCommands();
    await deployCommands();
  }

  process.exit(0);
})();
