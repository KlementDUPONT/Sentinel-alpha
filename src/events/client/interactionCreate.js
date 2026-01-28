import { Events } from 'discord.js';
import logger from '../../utils/logger.js';
import { RESPONSE_MESSAGES } from '../../config/constants.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Gestion des commandes slash
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    }

    // Gestion des boutons
    if (interaction.isButton()) {
      await handleButton(interaction);
    }

    // Gestion des menus de sélection
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    }

    // Gestion des modals
    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }

    // Gestion des autocomplete
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
    }
  },
};

/**
 * Gère les commandes slash
 */
async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Command ${interaction.commandName} not found`);
    return;
  }

  try {
    // Log de la commande
    logger.command(
      interaction.user.tag,
      interaction.commandName,
      interaction.guild?.name || 'DM'
    );

    // Vérifier les cooldowns
    const cooldownCheck = interaction.client.commandHandler.checkCooldown(
      interaction.user.id,
      command.data.name,
      command.cooldown || 3
    );

    if (cooldownCheck.onCooldown) {
      const embed = CustomEmbedBuilder.warning(
        'Cooldown',
        RESPONSE_MESSAGES.COOLDOWN.replace('{time}', `${cooldownCheck.timeLeft}s`)
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifier si la commande nécessite une guilde
    if (command.guildOnly && !interaction.guild) {
      const embed = CustomEmbedBuilder.error(
        'Erreur',
        'Cette commande ne peut être utilisée que dans un serveur.'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifier les permissions de l'utilisateur
    if (command.permissions && interaction.guild) {
      const { PermissionManager } = await import('../../config/permissions.js');
      
      const missingPerms = PermissionManager.getMissingPermissions(
        interaction.member,
        command.permissions
      );

      if (missingPerms.length > 0) {
        const embed = CustomEmbedBuilder.error(
          'Permissions insuffisantes',
          `${RESPONSE_MESSAGES.NO_PERMISSION}\n\nPermissions requises : ${PermissionManager.formatPermissions(missingPerms)}`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // Vérifier les permissions du bot
    if (command.botPermissions && interaction.guild) {
      const { PermissionManager } = await import('../../config/permissions.js');
      
      const botMissingPerms = PermissionManager.getMissingPermissions(
        interaction.guild.members.me,
        command.botPermissions
      );

      if (botMissingPerms.length > 0) {
        const embed = CustomEmbedBuilder.error(
          'Permissions du bot insuffisantes',
          `${RESPONSE_MESSAGES.BOT_NO_PERMISSION}\n\nPermissions requises : ${PermissionManager.formatPermissions(botMissingPerms)}`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // Exécuter la commande
    await command.execute(interaction);

  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`);
    logger.error(error);
    
    // Utiliser le ErrorHandler
    await interaction.client.errorHandler.handleCommandError(interaction, error);
  }
}

/**
 * Gère les boutons
 */
async function handleButton(interaction) {
  logger.info(`[Button] ${interaction.user.tag} clicked: ${interaction.customId}`);

  // Gestion des boutons de pagination
  if (interaction.customId.startsWith('pagination_')) {
    // Géré automatiquement par le système de pagination
    return;
  }

  // Gestion des boutons de tickets
  if (interaction.customId.startsWith('ticket_')) {
    // À implémenter dans les commandes de tickets
    return;
  }

  // Autres boutons personnalisés...
}

/**
 * Gère les menus de sélection
 */
async function handleSelectMenu(interaction) {
  logger.info(`[Select] ${interaction.user.tag} selected: ${interaction.customId}`);

  // Gestion des menus de tickets
  if (interaction.customId === 'ticket_category') {
    // À implémenter dans les commandes de tickets
    return;
  }

  // Autres menus personnalisés...
}

/**
 * Gère les modals
 */
async function handleModal(interaction) {
  logger.info(`[Modal] ${interaction.user.tag} submitted: ${interaction.customId}`);

  // À implémenter selon les besoins
}

/**
 * Gère l'autocomplete
 */
async function handleAutocomplete(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command || !command.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    logger.error(`Error in autocomplete for ${interaction.commandName}:`);
    logger.error(error);
  }
}
