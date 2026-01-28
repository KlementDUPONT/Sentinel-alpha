import { InteractionType, PermissionFlagsBits } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  name: 'interactionCreate',
  category: 'client',

  async execute(interaction) {
    try {
      if (interaction.type === InteractionType.ApplicationCommand) {
        await handleCommand(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
      }
    } catch (error) {
      logger.error('Error in interactionCreate event:', error);
      
      const errorMessage = {
        content: '❌ Une erreur est survenue lors du traitement de cette interaction.',
        flags: 64 // EPHEMERAL
      };

      try {
        if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else if (!interaction.replied) {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
    }
  }
};

async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return await interaction.reply({
      content: '❌ Cette commande n\'existe pas.',
      flags: 64 // EPHEMERAL
    });
  }

  try {
    // Check if command is enabled
    if (command.enabled === false) {
      return await interaction.reply({
        content: '❌ Cette commande est actuellement désactivée.',
        flags: 64 // EPHEMERAL
      });
    }

    // Check if command is owner only
    if (command.ownerOnly && interaction.user.id !== interaction.client.config.ownerId) {
      return await interaction.reply({
        content: '❌ Cette commande est réservée au propriétaire du bot.',
        flags: 64 // EPHEMERAL
      });
    }

    // Check if command is guild only
    if (command.guildOnly && !interaction.guild) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être utilisée qu\'en serveur.',
        flags: 64 // EPHEMERAL
      });
    }

    // Check cooldown
    const cooldownKey = `${interaction.commandName}-${interaction.user.id}`;
    const now = Date.now();
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (interaction.client.cooldowns.has(cooldownKey)) {
      const expirationTime = interaction.client.cooldowns.get(cooldownKey) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return await interaction.reply({
          content: `⏰ Veuillez attendre ${timeLeft.toFixed(1)} seconde(s) avant de réutiliser \`${interaction.commandName}\`.`,
          flags: 64 // EPHEMERAL
        });
      }
    }

    // Check bot permissions
    if (command.botPermissions && interaction.guild) {
      const botMember = interaction.guild.members.me;
      const missingPerms = botMember.permissions.missing(command.botPermissions);

      if (missingPerms.length > 0) {
        return await interaction.reply({
          content: `❌ Je n'ai pas les permissions nécessaires: \`${missingPerms.join(', ')}\``,
          flags: 64 // EPHEMERAL
        });
      }
    }

    // Check user permissions
    if (command.userPermissions && interaction.guild) {
      if (!interaction.member || !interaction.member.permissions) {
        return await interaction.reply({
          content: '❌ Impossible de vérifier vos permissions.',
          flags: 64 // EPHEMERAL
        });
      }

      const missingPerms = interaction.member.permissions.missing(command.userPermissions);

      if (missingPerms.length > 0) {
        return await interaction.reply({
          content: `❌ Vous n'avez pas les permissions nécessaires: \`${missingPerms.join(', ')}\``,
          flags: 64 // EPHEMERAL
        });
      }
    }

    // Set cooldown
    interaction.client.cooldowns.set(cooldownKey, now);
    setTimeout(() => interaction.client.cooldowns.delete(cooldownKey), cooldownAmount);

    // Execute command
    await command.execute(interaction);

    // Log command execution
    logger.info(
      `Command executed: /${interaction.commandName} by ${interaction.user.tag} in ${
        interaction.guild ? interaction.guild.name : 'DM'
      }`
    );

  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    logger.error(`❌ Command Error [${interaction.commandName}]:`, {
      user: `${interaction.user.tag} (${interaction.user.id})`,
      guild: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
      error: error.message
    });

    const errorMessage = {
      content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
      flags: 64 // EPHEMERAL
    };

    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else if (!interaction.replied) {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleButton(interaction) {
  const [action, ...args] = interaction.customId.split('_');
  
  logger.info(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`);

  // Handle button interactions
  switch (action) {
    case 'help':
      await handleHelpButton(interaction, args);
      break;
    case 'ticket':
      await handleTicketButton(interaction, args);
      break;
    default:
      await interaction.reply({
        content: '❌ Bouton non reconnu.',
        flags: 64 // EPHEMERAL
      });
  }
}

async function handleSelectMenu(interaction) {
  const [action] = interaction.customId.split('_');
  
  logger.info(`Select menu used: ${interaction.customId} by ${interaction.user.tag}`);

  // Handle select menu interactions
  switch (action) {
    case 'help':
      await handleHelpSelect(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Menu non reconnu.',
        flags: 64 // EPHEMERAL
      });
  }
}

async function handleModal(interaction) {
  const [action] = interaction.customId.split('_');
  
  logger.info(`Modal submitted: ${interaction.customId} by ${interaction.user.tag}`);

  // Handle modal submissions
  switch (action) {
    case 'ticket':
      await handleTicketModal(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Modal non reconnu.',
        flags: 64 // EPHEMERAL
      });
  }
}

// Helper functions for interactions
async function handleHelpButton(interaction, args) {
  const category = args[0];
  const commands = interaction.client.commands;
  
  // Implementation for help button
  await interaction.deferUpdate();
}

async function handleHelpSelect(interaction) {
  const category = interaction.values[0];
  const commands = interaction.client.commands;
  
  // Implementation for help select menu
  await interaction.deferUpdate();
}

async function handleTicketButton(interaction, args) {
  // Implementation for ticket button
  await interaction.deferReply({ flags: 64 }); // EPHEMERAL
}

async function handleTicketModal(interaction) {
  // Implementation for ticket modal
  await interaction.deferReply({ flags: 64 }); // EPHEMERAL
}
